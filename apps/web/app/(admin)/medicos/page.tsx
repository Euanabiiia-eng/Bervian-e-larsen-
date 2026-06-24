'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import Modal from '@/components/Modal'
import { PlusIcon, EditIcon, SpinnerIcon } from '@/components/icons'
import type { Medico } from '@apice/types'

interface MedicoFormData {
  nome: string
  email: string
  crm: string
  especialidade: string
  formacao: string
  bio: string
  agenda: string
}

const emptyForm: MedicoFormData = {
  nome: '', email: '', crm: '', especialidade: '', formacao: '', bio: '', agenda: '',
}

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Medico | null>(null)
  const [form, setForm] = useState<MedicoFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Medico[] }>('/admin/medicos')
      setMedicos(res.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar médicos')
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

  function openEdit(m: Medico) {
    setEditing(m)
    setForm({
      nome: m.user.nome, email: m.user.email, crm: m.crm,
      especialidade: m.especialidade, formacao: m.formacao ?? '',
      bio: m.bio ?? '', agenda: m.agenda ?? '',
    })
    setModalOpen(true)
  }

  function set(field: keyof MedicoFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!form.nome || !form.crm || !form.especialidade) {
      toast.error('Nome, CRM e especialidade são obrigatórios')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/admin/medicos/${editing.id}`, {
          crm: form.crm, especialidade: form.especialidade,
          formacao: form.formacao || undefined, bio: form.bio || undefined,
          agenda: form.agenda || undefined,
        })
        toast.success('Médico atualizado')
      } else {
        await api.post('/admin/medicos', {
          nome: form.nome, email: form.email, crm: form.crm,
          especialidade: form.especialidade, formacao: form.formacao || undefined,
          bio: form.bio || undefined, agenda: form.agenda || undefined,
        })
        toast.success('Médico criado')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar médico')
    } finally {
      setSaving(false)
    }
  }

  function getInitials(nome: string) {
    return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><SpinnerIcon size={32} /></div>
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Médicos"
        subtitle="Equipe clínica e agenda"
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Novo Médico
          </button>
        }
      />

      {medicos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-pale">
          <p className="font-cormorant italic text-2xl mb-2">Nenhum médico cadastrado</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light rounded-sm mt-4">
            <PlusIcon /> Adicionar Médico
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicos.map((m) => (
            <div key={m.id} className="bg-white-cream border border-card2 rounded-sm overflow-hidden hover:border-gold/30 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <span className="font-cormorant italic text-gold text-lg">{getInitials(m.user.nome)}</span>
                    </div>
                    <div>
                      <p className="font-jost text-sm text-ink">{m.user.nome}</p>
                      <p className="font-jost font-light text-xs text-ink-pale">CRM-RS {m.crm}</p>
                    </div>
                  </div>
                  <button onClick={() => openEdit(m)} className="text-ink-pale hover:text-gold transition-colors p-1">
                    <EditIcon size={14} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-jost font-light text-ink-pale w-24">Especialidade</span>
                    <span className="text-xs font-jost text-ink">{m.especialidade}</span>
                  </div>
                  {m.formacao && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-jost font-light text-ink-pale w-24">Formação</span>
                      <span className="text-xs font-jost text-ink">{m.formacao}</span>
                    </div>
                  )}
                  {m.agenda && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-jost font-light text-ink-pale w-24">Agenda</span>
                      <span className="text-xs font-jost text-ink">{m.agenda}</span>
                    </div>
                  )}
                </div>

                {m.bio && (
                  <p className="mt-4 text-xs font-jost font-light text-ink-pale leading-relaxed line-clamp-3">{m.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Médico' : 'Novo Médico'} size="md">
        <div className="flex flex-col gap-4">
          {!editing && (
            <>
              <div>
                <label className="block text-xs font-jost font-light text-ink-pale mb-1">Nome completo *</label>
                <input value={form.nome} onChange={set('nome')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Dr. Nome Sobrenome" />
              </div>
              <div>
                <label className="block text-xs font-jost font-light text-ink-pale mb-1">E-mail *</label>
                <input type="email" value={form.email} onChange={set('email')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">CRM *</label>
              <input value={form.crm} onChange={set('crm')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="12345" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Especialidade *</label>
              <input value={form.especialidade} onChange={set('especialidade')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Cirurgia Plástica Facial" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Formação</label>
            <input value={form.formacao} onChange={set('formacao')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="UFRGS, Residência em Cirurgia Plástica" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Agenda (dias de atendimento)</label>
            <input value={form.agenda} onChange={set('agenda')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="Seg Ter Qui" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Bio</label>
            <textarea value={form.bio} onChange={set('bio')} rows={3} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" placeholder="Breve apresentação do médico..." />
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
