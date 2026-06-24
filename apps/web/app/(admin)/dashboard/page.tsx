'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '@/lib/api'
import KpiCard from '@/components/KpiCard'
import SectionHeader from '@/components/SectionHeader'
import Badge from '@/components/Badge'
import { SpinnerIcon } from '@/components/icons'
import type { DashboardData } from '@apice/types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(s: string) {
  const map: Record<string, { label: string; variant: 'gold' | 'ok' | 'danger' | 'neutral' }> = {
    agendada: { label: 'Agendada', variant: 'gold' },
    realizada: { label: 'Realizada', variant: 'ok' },
    cancelada: { label: 'Cancelada', variant: 'danger' },
  }
  return map[s] ?? { label: s, variant: 'neutral' }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'semana' | 'mes' | 'trimestre' | 'ano'>('mes')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: DashboardData }>('/clinic/dashboard', {
        params: { period, mes, ano },
      })
      setData(res.data.data ?? null)
    } catch {
      // keep previous data
    } finally {
      setLoading(false)
    }
  }, [period, mes, ano])

  useEffect(() => { load() }, [load])

  const kpis = data?.kpis
  const grafico = data?.grafico ?? []
  const proximas = data?.proximasCirurgias ?? []

  return (
    <div className="p-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Visão geral da clínica"
        action={
          <div className="flex items-center gap-2">
            {(['semana', 'mes', 'trimestre', 'ano'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-jost font-light rounded-sm border transition-colors ${
                  period === p
                    ? 'bg-gold text-white-cream border-gold'
                    : 'border-card2 text-ink-pale hover:border-gold/50'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            {period === 'mes' && (
              <>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="ml-2 border border-card2 rounded-sm px-2 py-1.5 text-xs font-jost bg-white-cream text-ink"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="border border-card2 rounded-sm px-2 py-1.5 text-xs font-jost bg-white-cream text-ink"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <SpinnerIcon size={32} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard title="Atendimentos" value={kpis?.atendimentos ?? 0} variacao={kpis?.atendimentosVariacao} />
            <KpiCard title="Leads em Aberto" value={kpis?.leadsAbertos ?? 0} variacao={kpis?.leadsVariacao} />
            <KpiCard title="Leads p/ Fechamento" value={formatCurrency(kpis?.valorPotencial ?? 0)} />
            <KpiCard title="Cirurgias Agendadas" value={kpis?.cirurgiasAgendadas ?? 0} variacao={kpis?.cirurgiasVariacao} />
            <KpiCard title="Receita do Período" value={formatCurrency(kpis?.receitaPeriodo ?? 0)} variacao={kpis?.receitaVariacao} />
            <KpiCard title="Ticket Médio" value={formatCurrency(kpis?.ticketMedio ?? 0)} />
            <KpiCard title="Taxa de Conversão" value={`${(kpis?.taxaConversao ?? 0).toFixed(1)}%`} />
            <KpiCard title="NPS Médio" value={(kpis?.npsMedia ?? 0).toFixed(1)} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white-cream border border-card2 rounded-sm p-6">
              <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-4">Cirurgias por Mês</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={grafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DAC8" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'Jost', fill: '#6A6458' }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'Jost', fill: '#6A6458' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #E4DAC8', background: '#F7F2EA' }}
                  />
                  <Bar dataKey="cirurgias" fill="#8B6914" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white-cream border border-card2 rounded-sm p-6">
              <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-4">Receita por Mês (R$)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={grafico} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DAC8" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: 'Jost', fill: '#6A6458' }} />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: 'Jost', fill: '#6A6458' }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #E4DAC8', background: '#F7F2EA' }}
                    formatter={(v: number) => [formatCurrency(v), 'Receita']}
                  />
                  <Bar dataKey="receita" fill="#B8965A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Next Surgeries */}
          <div className="bg-white-cream border border-card2 rounded-sm">
            <div className="px-6 py-4 border-b border-card2">
              <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest">Próximas Cirurgias</p>
            </div>
            {proximas.length === 0 ? (
              <div className="px-6 py-10 text-center text-ink-pale font-jost font-light text-sm">
                Nenhuma cirurgia agendada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card2">
                      {['Paciente', 'Procedimento', 'Médico', 'Data', 'Hospital', 'Duração', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proximas.map((c) => {
                      const st = statusLabel(c.status)
                      return (
                        <tr key={c.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-jost">{(c.paciente as { user?: { nome?: string } })?.user?.nome ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.procedimento as { nome?: string })?.nome ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.medico as { user?: { nome?: string } })?.user?.nome ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-jost">{formatDate(c.data)}</td>
                          <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.hospital as { nome?: string })?.nome ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-jost text-ink-pale">{c.duracaoMin ? `${c.duracaoMin}min` : '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
