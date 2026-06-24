'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import { formatDateTime } from '@apice/utils'

interface Mensagem {
  id: string
  pacienteId: string
  remetente: string
  conteudo: string
  tipo: string
  pendienteAprovacao: boolean
  sugestaoIA?: string | null
  sentimentoLabel?: string | null
  createdAt: string
  paciente: { id: string; user: { nome: string } }
}

export default function MensagensPage() {
  const [tab, setTab] = useState<'pending' | 'historico'>('pending')
  const [pending, setPending] = useState<Mensagem[]>([])
  const [historico, setHistorico] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pRes, hRes] = await Promise.all([
        api.get('/clinic/mensagens/pending'),
        api.get('/clinic/mensagens/historico'),
      ])
      setPending(pRes.data.data)
      setHistorico(hRes.data.data)
    } catch { toast.error('Erro ao carregar mensagens') }
    finally { setLoading(false) }
  }

  async function handleApprove(id: string, texto?: string) {
    try {
      await api.post(`/clinic/mensagens/${id}/approve`, { textoFinal: texto })
      setPending((prev) => prev.filter((m) => m.id !== id))
      toast.success('Mensagem aprovada e enviada')
      setEditingId(null)
    } catch { toast.error('Erro ao aprovar mensagem') }
  }

  async function handleDiscard(id: string) {
    try {
      await api.post(`/clinic/mensagens/${id}/discard`)
      setPending((prev) => prev.filter((m) => m.id !== id))
      toast.success('Mensagem descartada — resposta padrão enviada')
    } catch { toast.error('Erro ao descartar') }
  }

  const sentimentColors: Record<string, string> = {
    positivo: 'text-ok',
    neutro: 'text-ink-pale',
    negativo: 'text-danger',
    risco: 'text-danger font-medium',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl italic text-ink">Mensagens</h1>
        <p className="text-ink-pale text-sm font-light mt-1">Aprovação de respostas IA e histórico</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card2">
        {[
          { key: 'pending', label: 'Pendentes', badge: pending.length },
          { key: 'historico', label: 'Histórico' },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key as 'pending' | 'historico')}
            className={clsx(
              'px-5 py-3 text-sm font-light tracking-wide border-b-2 transition-colors flex items-center gap-2',
              tab === key
                ? 'border-gold text-gold'
                : 'border-transparent text-ink-pale hover:text-ink'
            )}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card animate-pulse h-32 rounded" />)}
        </div>
      ) : tab === 'pending' ? (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="text-center py-16 text-ink-pale">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-light">Nenhuma mensagem pendente</p>
            </div>
          ) : (
            pending.map((m) => (
              <div key={m.id} className="bg-white border border-card2 rounded overflow-hidden">
                <div className="px-5 py-3 border-b border-card/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink font-light">{m.paciente.user.nome}</span>
                    <span className="text-xs text-ink-pale">{formatDateTime(m.createdAt)}</span>
                  </div>
                  {m.sentimentoLabel && (
                    <span className={clsx('text-xs', sentimentColors[m.sentimentoLabel])}>
                      {m.sentimentoLabel}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-ink-pale font-light mb-2">Mensagem do paciente</p>
                    <div className="bg-ink text-white rounded p-3 text-sm font-light leading-relaxed">
                      {m.conteudo}
                    </div>
                  </div>

                  {m.sugestaoIA && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-ink-pale font-light mb-2">Sugestão da IA</p>
                      {editingId === m.id ? (
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full border border-card2 rounded p-3 text-ink text-sm outline-none focus:border-gold resize-none bg-card/30"
                        />
                      ) : (
                        <div
                          className="bg-card rounded p-3 text-sm text-ink font-light leading-relaxed cursor-pointer hover:bg-card2 transition-colors"
                          onClick={() => { setEditingId(m.id); setEditText(m.sugestaoIA!) }}
                        >
                          {m.sugestaoIA}
                          <span className="text-xs text-ink-pale ml-2">(clique para editar)</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(m.id, editingId === m.id ? editText : m.sugestaoIA ?? undefined)}
                      className="flex items-center gap-2 bg-ok text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:opacity-90 transition-opacity rounded"
                    >
                      <CheckCircle size={14} /> Aprovar e Enviar
                    </button>
                    <button
                      onClick={() => handleDiscard(m.id)}
                      className="flex items-center gap-2 border border-danger text-danger px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-danger/5 transition-colors rounded"
                    >
                      <XCircle size={14} /> Descartar
                    </button>
                    {editingId === m.id && (
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-ink-pale hover:text-ink"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white border border-card2 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card2">
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Paciente</th>
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Mensagem</th>
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Remetente</th>
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Tipo</th>
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Sentimento</th>
                <th className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">Data</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-pale">Nenhuma mensagem no histórico</td>
                </tr>
              ) : (
                historico.map((m) => (
                  <tr key={m.id} className="border-b border-card/50 hover:bg-card/20">
                    <td className="px-5 py-3 text-ink font-light">{m.paciente.user.nome}</td>
                    <td className="px-5 py-3 text-ink-pale font-light max-w-xs truncate">{m.conteudo}</td>
                    <td className="px-5 py-3">
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        m.remetente === 'patient' ? 'bg-ink text-white' :
                        m.remetente === 'ai' ? 'bg-gold-pale text-ink' : 'bg-card2 text-ink'
                      )}>
                        {m.remetente === 'patient' ? 'Paciente' : m.remetente === 'ai' ? 'IA' : 'Clínica'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-pale text-xs">
                      {m.tipo === 'auto' ? 'IA Auto' : m.tipo === 'aprovado' ? 'Aprovado' : 'Manual'}
                    </td>
                    <td className={clsx('px-5 py-3 text-xs', m.sentimentoLabel ? sentimentColors[m.sentimentoLabel] : 'text-ink-pale')}>
                      {m.sentimentoLabel ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-pale text-xs whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
