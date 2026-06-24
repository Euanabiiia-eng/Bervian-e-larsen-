'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import MensagemAprovacao from '@/components/MensagemAprovacao'
import Badge from '@/components/Badge'
import { SpinnerIcon } from '@/components/icons'
import type { Mensagem } from '@apice/types'

type Tab = 'pendentes' | 'historico'

function tipoVariant(tipo: string): 'gold' | 'ok' | 'ink' | 'neutral' {
  if (tipo === 'auto') return 'gold'
  if (tipo === 'aprovado') return 'ok'
  if (tipo === 'manual') return 'ink'
  return 'neutral'
}

function tipoLabel(tipo: string) {
  if (tipo === 'auto') return 'IA Auto'
  if (tipo === 'aprovado') return 'Aprovado'
  if (tipo === 'manual') return 'Manual'
  return tipo
}

export default function MensagensPage() {
  const [tab, setTab] = useState<Tab>('pendentes')
  const [pendentes, setPendentes] = useState<Mensagem[]>([])
  const [historico, setHistorico] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<NodeJS.Timeout>()

  const loadPendentes = useCallback(async () => {
    try {
      const res = await api.get<{ data: Mensagem[] }>('/clinic/mensagens/pending')
      setPendentes(res.data.data ?? [])
    } catch {
      // silent
    }
  }, [])

  const loadHistorico = useCallback(async () => {
    try {
      const res = await api.get<{ data: Mensagem[] }>('/clinic/mensagens/historico')
      setHistorico(res.data.data ?? [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadPendentes(), loadHistorico()])
      setLoading(false)
    }
    init()

    pollRef.current = setInterval(loadPendentes, 30_000)
    return () => clearInterval(pollRef.current)
  }, [loadPendentes, loadHistorico])

  async function handleApprove(id: string) {
    try {
      await api.post(`/clinic/mensagens/${id}/approve`)
      setPendentes((prev) => prev.filter((m) => m.id !== id))
      toast.success('Mensagem aprovada e enviada')
      loadHistorico()
    } catch {
      toast.error('Erro ao aprovar mensagem')
    }
  }

  async function handleDiscard(id: string) {
    try {
      await api.post(`/clinic/mensagens/${id}/discard`)
      setPendentes((prev) => prev.filter((m) => m.id !== id))
      toast.success('Mensagem descartada')
      loadHistorico()
    } catch {
      toast.error('Erro ao descartar mensagem')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <SpinnerIcon size={32} />
      </div>
    )
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Mensagens"
        subtitle="Central de aprovação e histórico de conversas"
        action={
          pendentes.length > 0 ? (
            <span className="bg-danger text-white-cream text-xs font-jost px-2 py-0.5 rounded-full">
              {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </span>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-card2">
        {(['pendentes', 'historico'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-jost font-light border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-gold text-gold' : 'border-transparent text-ink-pale hover:text-ink'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'pendentes' && pendentes.length > 0 && (
              <span className="ml-2 bg-danger text-white-cream text-xs px-1.5 py-0.5 rounded-full">
                {pendentes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pendentes' && (
        <div className="space-y-4">
          {pendentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-ink-pale">
              <p className="font-cormorant italic text-2xl mb-2">Tudo em dia</p>
              <p className="font-jost font-light text-sm">Nenhuma mensagem aguardando aprovação.</p>
            </div>
          ) : (
            pendentes.map((m) => (
              <MensagemAprovacao
                key={m.id}
                mensagem={m}
                onApprove={handleApprove}
                onDiscard={handleDiscard}
              />
            ))
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden">
          {historico.length === 0 ? (
            <div className="px-6 py-10 text-center text-ink-pale font-jost font-light text-sm">
              Nenhuma mensagem no histórico
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card2">
                    {['Paciente', 'Mensagem', 'Tipo', 'Data/Hora'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historico.map((m) => (
                    <tr key={m.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-jost">
                        {(m as { paciente?: { user?: { nome?: string } } }).paciente?.user?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale max-w-xs">
                        <span className="line-clamp-1">{m.conteudo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tipoVariant(m.tipo)}>{tipoLabel(m.tipo)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">
                        {new Date(m.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
