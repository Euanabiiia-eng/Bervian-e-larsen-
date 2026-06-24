'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Pencil, UserCheck, X } from 'lucide-react'

interface Medico {
  id: string
  crm: string
  especialidade: string
  formacao?: string | null
  bio?: string | null
  agenda?: string | null
  ativo: boolean
  user: { id: string; nome: string; email: string; telefone?: string | null }
  _count?: { pacientes: number; cirurgias: number }
}

const empty = { nome: '', email: '', telefone: '', crm: '', especialidade: '', formacao: '', bio: '', agenda: '' }

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Medico | null>(null)
  const [formData, setFormData] = useState(empty)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/medicos')
      setMedicos(data.data)
    } catch { toast.error('Erro ao carregar médicos') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setSelected(null)
    setFormData(empty)
    setShowForm(true)
  }

  function openEdit(m: Medico) {
    setSelected(m)
    setFormData({ nome: m.user.nome, email: m.user.email, telefone: m.user.telefone ?? '', crm: m.crm, especialidade: m.especialidade, formacao: m.formacao ?? '', bio: m.bio ?? '', agenda: m.agenda ?? '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.nome || !formData.crm) return toast.error('Nome e CRM são obrigatórios')
    try {
      if (selected) {
        const { data } = await api.patch(`/admin/medicos/${selected.id}`, {
          crm: formData.crm, especialidade: formData.especialidade, formacao: formData.formacao, bio: formData.bio, agenda: formData.agenda,
        })
        setMedicos((prev) => prev.map((m) => m.id === selected.id ? { ...data.data, _count: selected._count } : m))
        toast.success('Médico atualizado')
      } else {
        const { data } = await api.post('/admin/medicos', formData)
        setMedicos((prev) => [...prev, data.data])
        toast.success('Médico criado')
      }
      setShowForm(false)
    } catch { toast.error('Erro ao salvar médico') }
  }

  const f = (key: keyof typeof formData, val: string) => setFormData((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Médicos</h1>
          <p className="text-ink-pale text-sm font-light mt-1">Equipe cirúrgica da clínica</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">
          <Plus size={14} /> Novo Médico
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2].map((i) => <div key={i} className="bg-card animate-pulse h-48 rounded" />)}</div>
      ) : medicos.length === 0 ? (
        <div className="text-center py-16 text-ink-pale">
          <UserCheck size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-light">Nenhum médico cadastrado</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {medicos.map((m) => (
            <div key={m.id} className="bg-white border border-card2 rounded p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-ink font-light text-lg">{m.user.nome}</h3>
                  <p className="text-gold text-xs mt-0.5">{m.crm}</p>
                  <p className="text-ink-pale text-sm mt-1">{m.especialidade}</p>
                </div>
                <button onClick={() => openEdit(m)} className="text-ink-pale hover:text-gold transition-colors p-1"><Pencil size={15} /></button>
              </div>
              {m.bio && <p className="text-ink-pale text-sm font-light leading-relaxed mb-3 line-clamp-3">{m.bio}</p>}
              <div className="flex items-center gap-4 text-xs text-ink-pale mt-3 pt-3 border-t border-card2">
                {m._count && (
                  <>
                    <span>{m._count.pacientes} paciente(s)</span>
                    <span>{m._count.cirurgias} cirurgia(s)</span>
                  </>
                )}
                {m.agenda && <span>Agenda: {m.agenda}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <h2 className="font-serif italic text-xl text-ink">{selected ? 'Editar Médico' : 'Novo Médico'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-pale hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {!selected && (
                <>
                  {[{ label: 'Nome *', key: 'nome' as const }, { label: 'E-mail *', key: 'email' as const }, { label: 'Telefone', key: 'telefone' as const }].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{label}</label>
                      <input value={formData[key]} onChange={(e) => f(key, e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                    </div>
                  ))}
                </>
              )}
              {[{ label: 'CRM *', key: 'crm' as const }, { label: 'Especialidade *', key: 'especialidade' as const }, { label: 'Formação', key: 'formacao' as const }, { label: 'Agenda (ex: Seg Ter Qui)', key: 'agenda' as const }].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{label}</label>
                  <input value={formData[key]} onChange={(e) => f(key, e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Bio</label>
                <textarea rows={4} value={formData.bio} onChange={(e) => f('bio', e.target.value)} className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold resize-none bg-transparent" />
              </div>
              <button onClick={handleSave} className="w-full bg-gold text-white py-2.5 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">
                {selected ? 'Salvar Alterações' : 'Criar Médico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
