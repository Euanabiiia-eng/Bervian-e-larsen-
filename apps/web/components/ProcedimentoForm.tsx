'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon, SpinnerIcon } from './icons'
import type { Procedimento, Hospital } from '@apice/types'

interface VideoFormData {
  titulo: string
  url: string
  duracao: string
  descricao: string
}

export interface ProcedimentoFormData {
  nome: string
  categoria: string
  duracaoMin: string
  anestesia: string
  valorBase: string
  hospitalId: string
  internacao: string
  recuperacaoDias: string
  complementares: string
  lembrete: string
  descricao: string
  orientacoesPre: string
  orientacoesPos: string
  materiais: string
}

interface ProcedimentoFormProps {
  initial?: Partial<ProcedimentoFormData>
  procedimentoId?: string
  hospitais: Hospital[]
  videos?: Procedimento['videos']
  onSubmit: (data: ProcedimentoFormData) => Promise<void>
  onAddVideo?: (video: VideoFormData) => Promise<void>
  onRemoveVideo?: (videoId: string) => Promise<void>
  isLoading?: boolean
}

const emptyVideo: VideoFormData = { titulo: '', url: '', duracao: '', descricao: '' }

export default function ProcedimentoForm({
  initial = {},
  procedimentoId,
  hospitais,
  videos = [],
  onSubmit,
  onAddVideo,
  onRemoveVideo,
  isLoading,
}: ProcedimentoFormProps) {
  const [form, setForm] = useState<ProcedimentoFormData>({
    nome: initial.nome ?? '',
    categoria: initial.categoria ?? 'Facial',
    duracaoMin: initial.duracaoMin ?? '120',
    anestesia: initial.anestesia ?? 'Geral',
    valorBase: initial.valorBase ?? '0',
    hospitalId: initial.hospitalId ?? '',
    internacao: initial.internacao ?? 'Day Hospital',
    recuperacaoDias: initial.recuperacaoDias ?? '14',
    complementares: initial.complementares ?? '',
    lembrete: initial.lembrete ?? '',
    descricao: initial.descricao ?? '',
    orientacoesPre: initial.orientacoesPre ?? '',
    orientacoesPos: initial.orientacoesPos ?? '',
    materiais: initial.materiais ?? '',
  })

  const [videoForm, setVideoForm] = useState<VideoFormData>(emptyVideo)
  const [addingVideo, setAddingVideo] = useState(false)

  function set(field: keyof ProcedimentoFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleAddVideo() {
    if (!videoForm.titulo || !onAddVideo) return
    setAddingVideo(true)
    await onAddVideo(videoForm)
    setVideoForm(emptyVideo)
    setAddingVideo(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Basic */}
      <div>
        <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-3">Informações Básicas</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Nome *</label>
            <input value={form.nome} onChange={set('nome')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Ex: Rinoplastia Primária" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Categoria</label>
            <select value={form.categoria} onChange={set('categoria')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              {['Facial', 'Corporal', 'Mamário', 'Minimamente Invasivo'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Duração (min) *</label>
            <input type="number" value={form.duracaoMin} onChange={set('duracaoMin')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Anestesia</label>
            <select value={form.anestesia} onChange={set('anestesia')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              {['Geral', 'Sedação', 'Local', 'Raqui'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Valor Base (R$)</label>
            <input type="number" value={form.valorBase} onChange={set('valorBase')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Hospital Padrão</label>
            <select value={form.hospitalId} onChange={set('hospitalId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              <option value="">Selecione</option>
              {hospitais.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Internação</label>
            <select value={form.internacao} onChange={set('internacao')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              {['Day Hospital', 'Hospital', '24h', '48h'].map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Dias de Recuperação</label>
            <input type="number" value={form.recuperacaoDias} onChange={set('recuperacaoDias')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Procedimentos Complementares</label>
            <input value={form.complementares} onChange={set('complementares')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Ex: Blefaroplastia, Lipoaspiração de mento" />
          </div>
        </div>
      </div>

      {/* Lembrete */}
      <div>
        <label className="block text-xs font-jost font-light text-ink-pale mb-1">Lembrete Automático (aparece no app do paciente)</label>
        <input value={form.lembrete} onChange={set('lembrete')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Ex: Uso de óculos é proibido por 30 dias após a cirurgia." />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs font-jost font-light text-ink-pale mb-1">Descrição para o Paciente</label>
        <textarea value={form.descricao} onChange={set('descricao')} rows={3} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" placeholder="Descrição do procedimento exibida no app..." />
      </div>

      {/* Pre-op */}
      <div>
        <label className="block text-xs font-jost font-light text-ink-pale mb-1">Orientações Pré-Operatórias</label>
        <textarea value={form.orientacoesPre} onChange={set('orientacoesPre')} rows={5} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" placeholder="Instruções de jejum, banho antisséptico, documentos necessários..." />
      </div>

      {/* Post-op */}
      <div>
        <label className="block text-xs font-jost font-light text-ink-pale mb-1">Orientações Pós-Operatórias</label>
        <textarea value={form.orientacoesPos} onChange={set('orientacoesPos')} rows={5} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" placeholder="Cuidados pós-cirúrgicos, restrições, sinais de alerta..." />
      </div>

      {/* Materials */}
      <div>
        <label className="block text-xs font-jost font-light text-ink-pale mb-1">Materiais / Checklist Cirúrgico (um por linha)</label>
        <textarea value={form.materiais} onChange={set('materiais')} rows={4} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" placeholder="Malha compressora nasal&#10;Fita micropore bege&#10;Gelo gel reutilizável" />
      </div>

      {/* Videos — only shown when editing existing procedure */}
      {procedimentoId && (
        <div>
          <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-3">Vídeos Educativos</p>
          {videos.length > 0 && (
            <div className="space-y-2 mb-4">
              {videos.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-card rounded-sm px-4 py-2.5 border border-card2">
                  <div>
                    <p className="text-sm font-jost">{v.titulo}</p>
                    {v.duracao && <p className="text-xs font-jost font-light text-ink-pale">{v.duracao}</p>}
                  </div>
                  {onRemoveVideo && (
                    <button onClick={() => onRemoveVideo(v.id)} className="text-ink-pale hover:text-danger transition-colors ml-4">
                      <TrashIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border border-card2 rounded-sm p-4 bg-card/30">
            <p className="text-xs font-jost font-light text-ink-pale mb-3">Adicionar Vídeo</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={videoForm.titulo} onChange={(e) => setVideoForm((f) => ({ ...f, titulo: e.target.value }))} className="col-span-2 border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Título do vídeo *" />
              <input value={videoForm.url} onChange={(e) => setVideoForm((f) => ({ ...f, url: e.target.value }))} className="border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="URL do vídeo" />
              <input value={videoForm.duracao} onChange={(e) => setVideoForm((f) => ({ ...f, duracao: e.target.value }))} className="border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Duração (ex: 8:24)" />
              <input value={videoForm.descricao} onChange={(e) => setVideoForm((f) => ({ ...f, descricao: e.target.value }))} className="col-span-2 border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Descrição (opcional)" />
            </div>
            <button onClick={handleAddVideo} disabled={!videoForm.titulo || addingVideo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-jost font-light bg-ink text-white-cream rounded-sm hover:bg-ink-dim transition-colors disabled:opacity-40">
              {addingVideo ? <SpinnerIcon size={12} /> : <PlusIcon size={12} />}
              Adicionar Vídeo
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button onClick={() => onSubmit(form)} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-jost font-light bg-gold text-white-cream rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
          {isLoading && <SpinnerIcon size={14} />}
          Salvar Procedimento
        </button>
      </div>
    </div>
  )
}
