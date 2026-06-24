'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Users, X, Search } from 'lucide-react'
import { formatDate, formatCurrency } from '@apice/utils'
import clsx from 'clsx'

interface Paciente {
  id: string
  status: string
  dataCirurgia?: string | null
  horaCirurgia?: string | null
  valor?: number | null
  scoreEngajamento: number
  user: { id: string; nome: string; email: string; telefone?: string | null }
  procedimento?: { id: string; nome: string } | null
  medico?: { id: string; user: { nome: string } } | null
}

const statusLabels: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'text-ink-pale bg-card' },
  pre_op: { label: 'Pré-op', color: 'text-gold bg-gold-pale/20' },
  pos_op: { label: 'Pós-op', color: 'text-ok bg-ok/10' },
  alta: { label: 'Alta', color: 'text-ink-pale bg-card2' },
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [procedimentos, setProcedimentos] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', procedimentoId: '', medicoId: '', dataCirurgia: '', horaCirurgia: '', valor: '',
  })

  useEffect(() => {
    loadData()
    api.get('/admin/procedimentos').then((r) => setProcedimentos(r.data.data))
    api.get('/admin/medicos').then((r) => setMedicos(r.data.data))
  }, [filterStatus])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const { data } = await api.get(`/clinic/pacientes?${params}`)
      setPacientes(data.data)
    } catch { toast.error('Erro ao carregar pacientes') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!formData.nome || !formData.email) return toast.error('Nome e e-mail são obrigatórios')
    try {
      const { data } = await api.post('/clinic/pacientes', {
        ...formData,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
        procedimentoId: formData.procedimentoId || undefined,
        medicoId: formData.medicoId || undefined,
      })
      setPacientes((prev) => [data.data, ...prev])
      setShowForm(false)
      toast.success('Paciente criado — jornada gerada automaticamente')
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Erro ao criar paciente')
    }
  }

  const filtered = pacientes.filter((p) => {
    const q = search.toLowerCase()
    return !q || p.user.nome.toLowerCase().includes(q) || p.user.email.toLowerCase().includes(q)
  })

  const f = (key: keyof typeof formData, val: string) => setFormData((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Pacientes</h1>
          <p className="text-ink-pale text-sm font-light mt-1">{pacientes.length} paciente(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">
          <Plus size={14} /> Novo Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-pale" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-8 pr-3 py-2 border border-card2 rounded text-sm text-ink outline-none focus:border-gold bg-white"
          />
        </div>
        <div className="flex border border-card2 rounded overflow-hidden">
          {[{ v: '', l: 'Todos' }, { v: 'pre_op', l: 'Pré-op' }, { v: 'pos_op', l: 'Pós-op' }, { v: 'alta', l: 'Alta' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={clsx('px-3 py-2 text-xs tracking-wide transition-colors', filterStatus === v ? 'bg-gold text-white' : 'bg-white text-ink-pale hover:bg-card')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="bg-card animate-pulse h-14 rounded" />)}</div>
      ) : (
        <div className="bg-white border border-card2 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card2">
                {['Paciente', 'Procedimento', 'Médico', 'Cirurgia', 'Valor', 'Status', 'Score'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-ink-pale text-xs uppercase tracking-widest font-light">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-pale">
                  <Users size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="font-light text-sm">Nenhum paciente encontrado</p>
                </td></tr>
              ) : filtered.map((p) => {
                const st = statusLabels[p.status] ?? { label: p.status, color: 'text-ink-pale bg-card' }
                return (
                  <tr key={p.id} className="border-b border-card/50 hover:bg-card/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-ink font-light">{p.user.nome}</p>
                      <p className="text-xs text-ink-pale">{p.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-pale font-light">{p.procedimento?.nome ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink-pale font-light">{p.medico?.user.nome ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink font-light whitespace-nowrap">
                      {p.dataCirurgia ? formatDate(p.dataCirurgia) : '—'}
                      {p.horaCirurgia ? ` · ${p.horaCirurgia}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-ink-pale">{p.valor ? formatCurrency(p.valor) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', st.color)}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-card2 rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(p.scoreEngajamento, 100)}%` }} />
                        </div>
                        <span className="text-xs text-ink-pale">{p.scoreEngajamento}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <h2 className="font-serif italic text-xl text-ink">Novo Paciente</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-pale hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[{ l: 'Nome *', k: 'nome' as const }, { l: 'E-mail *', k: 'email' as const }, { l: 'Telefone', k: 'telefone' as const }].map(({ l, k }) => (
                <div key={k}>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{l}</label>
                  <input value={formData[k]} onChange={(e) => f(k, e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Procedimento</label>
                <select value={formData.procedimentoId} onChange={(e) => f('procedimentoId', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent">
                  <option value="">Selecionar...</option>
                  {procedimentos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Médico</label>
                <select value={formData.medicoId} onChange={(e) => f('medicoId', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent">
                  <option value="">Selecionar...</option>
                  {medicos.map((m: any) => <option key={m.id} value={m.id}>{m.user.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Data Cirurgia</label>
                  <input type="date" value={formData.dataCirurgia} onChange={(e) => f('dataCirurgia', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Horário</label>
                  <input type="time" value={formData.horaCirurgia} onChange={(e) => f('horaCirurgia', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Valor (R$)</label>
                <input type="number" value={formData.valor} onChange={(e) => f('valor', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
              </div>
              <button onClick={handleSave} className="w-full bg-gold text-white py-2.5 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">Criar Paciente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
