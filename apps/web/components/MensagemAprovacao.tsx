'use client'

import { useState } from 'react'
import { CheckIcon, XIcon, SpinnerIcon } from './icons'
import type { Mensagem } from '@apice/types'

interface MensagemAprovacaoProps {
  mensagem: Mensagem & { paciente?: { user?: { nome?: string } } }
  onApprove: (id: string) => Promise<void>
  onDiscard: (id: string) => Promise<void>
}

export default function MensagemAprovacao({ mensagem, onApprove, onDiscard }: MensagemAprovacaoProps) {
  const [loading, setLoading] = useState<'approve' | 'discard' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    await onApprove(mensagem.id)
    setLoading(null)
  }

  async function handleDiscard() {
    setLoading('discard')
    await onDiscard(mensagem.id)
    setLoading(null)
  }

  const nome = (mensagem.paciente as { user?: { nome?: string } })?.user?.nome ?? 'Paciente'
  const hora = new Date(mensagem.createdAt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden hover:border-gold/30 transition-colors">
      {/* Header */}
      <div className="px-5 py-3 border-b border-card2 flex items-center justify-between">
        <div>
          <p className="text-sm font-jost font-light text-ink">{nome}</p>
          <p className="text-xs font-jost font-light text-ink-pale">{hora}</p>
        </div>
        <span className="text-xs font-jost font-light text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-sm">
          Aguarda aprovação
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-3">
        {/* Original question */}
        <div>
          <p className="text-2xs font-jost font-light text-ink-pale uppercase tracking-wider mb-1">Pergunta do paciente</p>
          <div className="bg-card rounded-sm px-4 py-3 border-l-2 border-ink-pale/30">
            <p className="text-sm font-jost font-light text-ink">{mensagem.conteudo}</p>
          </div>
        </div>

        {/* AI suggestion */}
        {mensagem.sugestaoIA && (
          <div>
            <p className="text-2xs font-jost font-light text-ink-pale uppercase tracking-wider mb-1">Sugestão da IA</p>
            <div className="bg-gold/5 rounded-sm px-4 py-3 border-l-2 border-gold/40">
              <p className="text-sm font-jost font-light text-ink">{mensagem.sugestaoIA}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-card2 flex items-center justify-end gap-3">
        <button
          onClick={handleDiscard}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-jost font-light text-danger border border-danger/30 rounded-sm hover:bg-danger/5 transition-colors disabled:opacity-40"
        >
          {loading === 'discard' ? <SpinnerIcon size={14} /> : <XIcon size={14} />}
          Descartar
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-jost font-light bg-ok text-white-cream rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading === 'approve' ? <SpinnerIcon size={14} /> : <CheckIcon size={14} />}
          Aprovar e Enviar
        </button>
      </div>
    </div>
  )
}
