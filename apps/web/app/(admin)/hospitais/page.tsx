'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { PlusIcon, EditIcon, TrashIcon, SpinnerIcon } from '@/components/icons'
import type { Hospital } from '@apice/types'

interface HospitalFormData {
  nome: string
  tipo: string
  endereco: string
  cidade: string
  telefone: string
  contato: string
  obs: string
}

const emptyForm: HospitalFormData = {
  nome: '', tipo: 'Hospital', endereco: '', cidade: '', telefone: '', contato: '', obs: '',
}

const tipoVariant: Record<string, 'gold' | 'ok' | 'ink'> = {
  'Hospital': 'ink',
  'Day Hospital': 'gold',
  'Centro Cirúrgico': 'ok',
}

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Hospital | null>(null)
  const [form, setForm] = useState<HospitalFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Hospital[] }>('/admin/hospitais')
      setHospitais(res.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar hospitais')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(h: Hospital) {
    setEditing(h)
    setForm({
      nome: h.nome, tipo: h.tipo,
      endereco: h.endereco ?? '', cidade: h.cidade ?? '',
      telefone: h.telefone ?? '', contato: h.contato ?? '', obs: h.obs ?? '',
    })
    setModalOpen(true)
  }

  function set(field: keyof HospitalFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        nome: form.nome, tipo: form.tipo,
        endereco: form.endereco || undefined, cidade: form.cidade || undefined,
        telefone: form.telefone || undefined, contato: form.contato || undefined,
        obs: form.obs || undefined,
      }
      if (editing) {
        await api.patch(`/admin/hospitais/${editing.id}`, payload)
        toast.success('Hospital atualizado')
      } else {
        await api.post('/admin/hospitais', payload)
        toast.success('Hospital criado')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar hospital')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este hospital?')) return
    try {
      await api.delete(`/admin/hospitais/${id}`)
      setHospitais((prev) => prev.filter((h) => h.id !== id))
      toast.success('Hospital removido')
    } catch {
      toast.error('Erro ao excluir hospital')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><SpinnerIcon size={32} /></div>
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Hospitais"
        subtitle="Locais de realização dos procedimentos"
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Novo Hospital
          </button>
        }
      />

      {hospitais.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-pale">
          <p className="font-cormorant italic text-2xl mb-2">Nenhum hospital cadastrado</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light rounded-sm mt-4">
            <PlusIcon /> Adicionar Hospital
          </button>
        </div>
      ) : (
        <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card2">
                  {['Nome', 'Tipo', 'Endereço', 'Cidade/UF', 'Telefone', 'Contato', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hospitais.map((h) => (
                  <tr key={h.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-jost">{h.nome}</td>
                    <td className="px-4 py-3"><Badge variant={tipoVariant[h.tipo] ?? 'neutral'}>{h.tipo}</Badge></td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{h.endereco ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{h.cidade ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{h.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{h.contato ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(h)} className="text-ink-pale hover:text-gold transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDelete(h.id)} className="text-ink-pale hover:text-danger transition-colors"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Hospital' : 'Novo Hospital'} size="md">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Nome *</label>
            <input value={form.nome} onChange={set('nome')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Tipo</label>
            <select value={form.tipo} onChange={set('tipo')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              {['Hospital', 'Day Hospital', 'Centro Cirúrgico'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Endereço</label>
            <input value={form.endereco} onChange={set('endereco')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Rua Ramiro Barcelos, 910" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Cidade/UF</label>
              <input value={form.cidade} onChange={set('cidade')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Porto Alegre/RS" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Telefone</label>
              <input value={form.telefone} onChange={set('telefone')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="(51) 3314-3000" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Contato Responsável</label>
            <input value={form.contato} onChange={set('contato')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Nome do responsável" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Observações</label>
            <textarea value={form.obs} onChange={set('obs')} rows={2} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-jost font-light text-ink-pale border border-card2 rounded-sm hover:border-gold/50 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-jost font-light bg-gold text-white-cream rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
              {saving && <SpinnerIcon size={14} />} Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
