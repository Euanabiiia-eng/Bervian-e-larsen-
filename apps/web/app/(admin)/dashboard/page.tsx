'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@apice/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'

const periods = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'ano', label: 'Ano' },
]

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface KpiData {
  atendimentos: number
  atendimentosVar: number
  leadsAbertos: number
  leadsVar: number
  leadsFechamento: { count: number; valor: number }
  cirurgiasAgendadas: number
  cirurgiasVar: number
  receita: number
  receitaVar: number
  ticketMedio: number
  taxaConversao: number
  npsScore: number
}

function VarBadge({ value }: { value: number }) {
  if (Math.abs(value) < 1) return <Minus size={12} className="text-ink-pale inline" />
  if (value > 0)
    return (
      <span className="text-ok text-xs flex items-center gap-0.5">
        <TrendingUp size={12} /> +{value}%
      </span>
    )
  return (
    <span className="text-danger text-xs flex items-center gap-0.5">
      <TrendingDown size={12} /> {value}%
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  varValue,
}: {
  label: string
  value: string
  sub?: string
  varValue?: number
}) {
  return (
    <div className="bg-white border border-card2 p-5 rounded space-y-1">
      <p className="text-ink-pale text-xs uppercase tracking-widest font-light">{label}</p>
      <p className="text-ink font-serif text-2xl font-light">{value}</p>
      {sub && <p className="text-ink-pale text-xs">{sub}</p>}
      {varValue !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <VarBadge value={varValue} />
          <span className="text-2xs text-ink-pale">vs período anterior</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('mes')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano] = useState(new Date().getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/clinic/dashboard?period=${period}&mes=${mes}&ano=${ano}`)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period, mes, ano])

  const kpis: KpiData | undefined = data?.kpis

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Dashboard</h1>
          <p className="text-ink-pale text-sm font-light mt-1">
            Clínica Bervian & Larsen — visão geral
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex border border-card2 rounded overflow-hidden">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={clsx(
                  'px-3 py-1.5 text-xs tracking-wide transition-colors',
                  period === p.value
                    ? 'bg-gold text-white'
                    : 'bg-white text-ink-pale hover:bg-card'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month selector (only for mes view) */}
          {period === 'mes' && (
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="border border-card2 rounded px-3 py-1.5 text-xs bg-white text-ink-pale outline-none"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card animate-pulse h-24 rounded" />
          ))}
        </div>
      ) : kpis ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Atendimentos"
              value={kpis.atendimentos.toString()}
              sub="cirurgias realizadas"
              varValue={kpis.atendimentosVar}
            />
            <KpiCard
              label="Leads Abertos"
              value={kpis.leadsAbertos.toString()}
              varValue={kpis.leadsVar}
            />
            <KpiCard
              label="Leads Fechamento"
              value={kpis.leadsFechamento.count.toString()}
              sub={formatCurrency(kpis.leadsFechamento.valor) + ' potencial'}
            />
            <KpiCard
              label="Cirurgias Agendadas"
              value={kpis.cirurgiasAgendadas.toString()}
              varValue={kpis.cirurgiasVar}
            />
            <KpiCard
              label="Receita"
              value={formatCurrency(kpis.receita)}
              varValue={kpis.receitaVar}
            />
            <KpiCard
              label="Ticket Médio"
              value={formatCurrency(kpis.ticketMedio)}
            />
            <KpiCard
              label="Taxa de Conversão"
              value={`${kpis.taxaConversao}%`}
            />
            <KpiCard
              label="NPS"
              value={kpis.npsScore.toString()}
              sub="satisfação média"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-card2 rounded p-5">
              <h3 className="text-sm text-ink-pale uppercase tracking-widest font-light mb-5">
                Cirurgias Realizadas — últimos 6 meses
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.charts?.cirurgiasMes ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DAC8" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6A6458' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6A6458' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#EDE5D8', border: '1px solid #D4B87A', fontSize: 12 }}
                    cursor={{ fill: '#EDE5D8' }}
                  />
                  <Bar dataKey="total" fill="#8B6914" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-card2 rounded p-5">
              <h3 className="text-sm text-ink-pale uppercase tracking-widest font-light mb-5">
                Receita — últimos 6 meses
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.charts?.receitaMes ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DAC8" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6A6458' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6A6458' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#EDE5D8', border: '1px solid #D4B87A', fontSize: 12 }}
                    cursor={{ fill: '#EDE5D8' }}
                    formatter={(v: number) => [formatCurrency(v), 'Receita']}
                  />
                  <Bar dataKey="total" fill="#B8965A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Surgeries */}
          <div className="bg-white border border-card2 rounded">
            <div className="px-5 py-4 border-b border-card2">
              <h3 className="text-sm text-ink-pale uppercase tracking-widest font-light">
                Próximas Cirurgias
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card2">
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Paciente</th>
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Procedimento</th>
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Médico</th>
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Data</th>
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Hospital</th>
                    <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.proximasCirurgias ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-ink-pale text-sm">
                        Nenhuma cirurgia agendada
                      </td>
                    </tr>
                  ) : (
                    data.proximasCirurgias.map((c: any) => (
                      <tr key={c.id} className="border-b border-card/50 hover:bg-card/30 transition-colors">
                        <td className="px-5 py-3.5 text-ink font-light">{c.paciente.user.nome}</td>
                        <td className="px-5 py-3.5 text-ink-pale font-light">{c.procedimento.nome}</td>
                        <td className="px-5 py-3.5 text-ink-pale font-light">{c.medico.user.nome}</td>
                        <td className="px-5 py-3.5 text-ink font-light whitespace-nowrap">
                          {formatDate(c.data)}{c.horaInicio ? ` · ${c.horaInicio}` : ''}
                        </td>
                        <td className="px-5 py-3.5 text-ink-pale font-light">{c.hospital.nome}</td>
                        <td className="px-5 py-3.5 text-ink-pale font-light">
                          {c.duracaoMin ? `${Math.round(c.duracaoMin / 60)}h${c.duracaoMin % 60 > 0 ? c.duracaoMin % 60 + 'min' : ''}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
