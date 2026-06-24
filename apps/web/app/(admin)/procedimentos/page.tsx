'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import ProcedimentoForm, { type ProcedimentoFormData } from '@/components/ProcedimentoForm'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { PlusIcon, EditIcon, TrashIcon, SpinnerIcon } from '@/components/icons'
import type { Procedimento, Hospital } from '@apice/types'

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Procedimento | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [procsRes, hospRes] = await Promise.all([
        api.get<{ data: Procedimento[] }>('/admin/procedimentos'),
        api.get<{ data: Hospital[] }>('/admin/hospitais'),
      ])
      setProcedimentos(procsRes.data.data ?? [])
      setHospitais(hospRes.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar procedimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(p: Procedimento) {
    setEditing(p)
    setModalOpen(true)
  }

  async function handleSave(data: ProcedimentoFormData) {
    setSaving(true)
    try {
      const payload = {
        nome: data.nome,
        categoria: data.categoria,
        duracaoMin: parseInt(data.duracaoMin),
        anestesia: data.anestesia,
        valorBase: parseFloat(data.valorBase),
        hospitalId: data.hospitalId || undefined,
        internacao: data.internacao,
        recuperacaoDias: parseInt(data.recuperacaoDias),
        complementares: data.complementares || undefined,
        lembrete: data.lembrete || undefined,
        descricao: data.descricao || undefined,
        orientacoesPre: data.orientacoesPre || undefined,
        orientacoesPos: data.orientacoesPos || undefined,
        materiais: data.materiais || undefined,
      }
      if (editing) {
        await api.patch(`/admin/procedimentos/${editing.id}`, payload)
        toast.success('Procedimento atualizado. Propagando para pacientes...')
      } else {
        await api.post('/admin/procedimentos', payload)
        toast.success('Procedimento criado com sucesso')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar procedimento')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddVideo(video: { titulo: string; url: string; duracao: string; descricao: string }) {
    if (!editing) return
    await api.post(`/admin/procedimentos/${editing.id}/videos`, video)
    toast.success('Vídeo adicionado')
    // refresh editing data
    const res = await api.get<{ data: Procedimento }>(`/admin/procedimentos/${editing.id}`)
    setEditing(res.data.data ?? editing)
    load()
  }

  async function handleRemoveVideo(videoId: string) {
    if (!editing) return
    await api.delete(`/admin/procedimentos/${editing.id}/videos/${videoId}`)
    toast.success('Vídeo removido')
    const res = await api.get<{ data: Procedimento }>(`/admin/procedimentos/${editing.id}`)
    setEditing(res.data.data ?? editing)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este procedimento?')) return
    try {
      await api.delete(`/admin/procedimentos/${id}`)
      setProcedimentos((prev) => prev.filter((p) => p.id !== id))
      toast.success('Procedimento removido')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const categoriaVariant: Record<string, 'gold' | 'ok' | 'ink' | 'neutral'> = {
    Facial: 'gold',
    Corporal: 'ok',
    Mamário: 'neutral',
    'Minimamente Invasivo': 'ink',
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
        title="Procedimentos"
        subtitle="Cadastro mestre — propagação automática para pacientes"
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Novo Procedimento
          </button>
        }
      />

      {procedimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-pale">
          <p className="font-cormorant italic text-2xl mb-2">Nenhum procedimento</p>
          <p className="font-jost font-light text-sm mb-6">Crie o primeiro procedimento para começar.</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light rounded-sm">
            <PlusIcon /> Criar Procedimento
          </button>
        </div>
      ) : (
        <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card2">
                  {['Nome', 'Categoria', 'Duração', 'Anestesia', 'Valor Base', 'Hospital', 'Vídeos', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {procedimentos.map((p) => (
                  <tr key={p.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-jost">{p.nome}</p>
                      {p.lembrete && (
                        <p className="text-xs font-jost font-light text-ink-pale mt-0.5 line-clamp-1">{p.lembrete}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={categoriaVariant[p.categoria] ?? 'neutral'}>{p.categoria}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm font-jost text-ink-pale">{p.duracaoMin}min</td>
                    <td className="px-4 py-4 text-sm font-jost text-ink-pale">{p.anestesia}</td>
                    <td className="px-4 py-4 text-sm font-jost text-gold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.valorBase)}
                    </td>
                    <td className="px-4 py-4 text-sm font-jost text-ink-pale">{p.hospital?.nome ?? '—'}</td>
                    <td className="px-4 py-4 text-sm font-jost text-ink-pale">{p.videos?.length ?? 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-ink-pale hover:text-gold transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-ink-pale hover:text-danger transition-colors"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar — ${editing.nome}` : 'Novo Procedimento'}
        size="xl"
      >
        <ProcedimentoForm
          initial={editing ? {
            nome: editing.nome,
            categoria: editing.categoria,
            duracaoMin: editing.duracaoMin.toString(),
            anestesia: editing.anestesia,
            valorBase: editing.valorBase.toString(),
            hospitalId: editing.hospitalId ?? '',
            internacao: editing.internacao,
            recuperacaoDias: editing.recuperacaoDias.toString(),
            complementares: editing.complementares ?? '',
            lembrete: editing.lembrete ?? '',
            descricao: editing.descricao ?? '',
            orientacoesPre: editing.orientacoesPre ?? '',
            orientacoesPos: editing.orientacoesPos ?? '',
            materiais: editing.materiais ?? '',
          } : undefined}
          procedimentoId={editing?.id}
          hospitais={hospitais}
          videos={editing?.videos ?? []}
          onSubmit={handleSave}
          onAddVideo={handleAddVideo}
          onRemoveVideo={handleRemoveVideo}
          isLoading={saving}
        />
      </Modal>
    </div>
  )
}
