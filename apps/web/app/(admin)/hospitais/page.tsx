'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Building2 } from 'lucide-react'

interface Hospital {
  id: string
  nome: string
  tipo: string
  endereco?: string | null
  cidade?: string | null
  telefone?: string | null
  contato?: string | null
  obs?: string | null
  ativo: boolean
}

const tipos = ['Hospital', 'Day Hospital', 'Centro Cirúrgico']
const empty = { nome: '', tipo: 'Hospital', endereco: '', cidade: '', telefone: '', contato: '', obs: '' }

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Hospital | null>(null)
  const [formData, setFormData] = useState(empty)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/hospitais')
      setHospitais(data.data)
    } catch { toast.error('Erro ao carregar hospitais') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setSelected(null)
    setFormData(empty)
    setShowForm(true)
  }

  function openEdit(h: Hospital) {
    setSelected(h)
    setFormData({ nome: h.nome, tipo: h.tipo, endereco: h.endereco ?? '', cidade: h.cidade ?? '', telefone: h.telefone ?? '', contato: h.contato ?? '', obs: h.obs ?? '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.nome) return toast.error('Nome é obrigatório')
    try {
      if (selected) {
        const { data } = await api.patch(`/admin/hospitais/${selected.id}`, formData)
        setHospitais((prev) => prev.map((h) => h.id === selected.id ? data.data : h))
        toast.success('Hospital atualizado')
      } else {
        const { data } = await api.post('/admin/hospitais', formData)
        setHospitais((prev) => [...prev, data.data])
        toast.success('Hospital criado')
      }
      setShowForm(false)
    } catch { toast.error('Erro ao salvar hospital') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar este hospital?')) return
    try {
      await api.delete(`/admin/hospitais/${id}`)
      setHospitais((prev) => prev.filter((h) => h.id !== id))
      toast.success('Hospital desativado')
    } catch { toast.error('Erro ao desativar') }
  }

  const f = (key: keyof typeof formData, val: string) => setFormData((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Hospitais</h1>
          <p className="text-ink-pale text-sm font-light mt-1">Locais de internação e centros cirúrgicos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors"
        >
          <Plus size={14} /> Novo Hospital
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-card animate-pulse h-20 rounded" />)}</div>
      ) : hospitais.length === 0 ? (
        <div className="text-center py-16 text-ink-pale">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-light">Nenhum hospital cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospitais.map((h) => (
            <div key={h.id} className="bg-white border border-card2 rounded p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-ink font-light">{h.nome}</h3>
                  <span className="text-xs text-ink-pale bg-card px-2 py-0.5 rounded-full">{h.tipo}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(h)} className="text-ink-pale hover:text-gold p-1 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(h.id)} className="text-ink-pale hover:text-danger p-1 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              {h.endereco && <p className="text-sm text-ink-pale font-light">{h.endereco}</p>}
              {h.cidade && <p className="text-xs text-ink-pale">{h.cidade}</p>}
              {h.telefone && <p className="text-xs text-ink-pale mt-1">{h.telefone}</p>}
              {h.contato && <p className="text-xs text-ink-pale italic mt-1">{h.contato}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <h2 className="font-serif italic text-xl text-ink">{selected ? 'Editar Hospital' : 'Novo Hospital'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-pale hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nome *', key: 'nome' as const },
                { label: 'Endereço', key: 'endereco' as const },
                { label: 'Cidade/UF', key: 'cidade' as const },
                { label: 'Telefone', key: 'telefone' as const },
                { label: 'Contato / Local', key: 'contato' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{label}</label>
                  <input
                    value={formData[key]}
                    onChange={(e) => f(key, e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => f('tipo', e.target.value)}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                >
                  {tipos.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Observações</label>
                <textarea
                  rows={2}
                  value={formData.obs}
                  onChange={(e) => f('obs', e.target.value)}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold resize-none bg-transparent"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-gold text-white py-2.5 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors"
              >
                {selected ? 'Salvar Alterações' : 'Criar Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
