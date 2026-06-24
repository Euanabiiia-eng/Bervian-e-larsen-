'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Scissors, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@apice/utils'
import clsx from 'clsx'

interface Cirurgia {
  id: string
  data: string
  horaInicio?: string | null
  duracaoMin?: number | null
  valor?: number | null
  status: string
  obs?: string | null
  statusPosOp?: string | null
  paciente: { id: string; user: { nome: string } }
  procedimento: { id: string; nome: string }
  medico: { id: string; user: { nome: string } }
  hospital: { id: string; nome: string }
}

const statusMap: Record<string, { label: string; color: string }> = {
  agendada: { label: 'Agendada', color: 'text-gold bg-gold-pale/20' },
  realizada: { label: 'Realizada', color: 'text-ok bg-ok/10' },
  cancelada: { label: 'Cancelada', color: 'text-danger bg-danger/10' },
}

export default function CirurgiasPage() {
  const [cirurgias, setCirurgias] = useState<Cirurgia[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [pacientes, setPacientes] = useState<any[]>([])
  const [procedimentos, setProcedimentos] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])
  const [hospitais, setHospitais] = useState<any[]>([])
  const [formData, setFormData] = useState({
    pacienteId: '', procedimentoId: '', medicoId: '', hospitalId: '', data: '', horaInicio: '', duracaoMin: '', valor: '', obs: '',
  })

  useEffect(() => {
    loadData()
    api.get('/clinic/pacientes').then((r) => setPacientes(r.data.data))
    api.get('/admin/procedimentos').then((r) => setProcedimentos(r.data.data))
    api.get('/admin/medicos').then((r) => setMedicos(r.data.data))
    api.get('/admin/hospitais').then((r) => setHospitais(r.data.data))
  }, [filterStatus])

  async function loadData() {
    setLoading(true)
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const { data } = await api.get(`/clinic/cirurgias${params}`)
      setCirurgias(data.data)
    } catch { toast.error('Erro ao carregar cirurgias') }
    finally { setLoading(false) }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const { data } = await api.patch(`/clinic/cirurgias/${id}`, { status })
      setCirurgias((prev) => prev.map((c) => c.id === id ? { ...c, status: data.data.status } : c))
      toast.success('Status atualizado')
    } catch { toast.error('Erro ao atualizar status') }
  }

  async function handleSave() {
    if (!formData.pacienteId || !formData.procedimentoId || !formData.data) {
      return toast.error('Paciente, procedimento e data são obrigatórios')
    }
    try {
      const { data } = await api.post('/clinic/cirurgias', {
        ...formData,
        duracaoMin: formData.duracaoMin ? parseInt(formData.duracaoMin) : undefined,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
      })
      setCirurgias((prev) => [...prev, data.data])
      setShowForm(false)
      toast.success('Cirurgia agendada')
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Erro ao agendar cirurgia')
    }
  }

  const f = (key: keyof typeof formData, val: string) => setFormData((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Cirurgias</h1>
          <p className="text-ink-pale text-sm font-light mt-1">{cirurgias.length} cirurgia(s) carregada(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">
          <Plus size={14} /> Agendar Cirurgia
        </button>
      </div>

      {/* Status filter */}
      <div className="flex border border-card2 rounded overflow-hidden w-fit">
        {[{ v: '', l: 'Todas' }, { v: 'agendada', l: 'Agendadas' }, { v: 'realizada', l: 'Realizadas' }, { v: 'cancelada', l: 'Canceladas' }].map(({ v, l }) => (
          <button key={v} onClick={() => setFilterStatus(v)} className={clsx('px-3 py-2 text-xs tracking-wide transition-colors', filterStatus === v ? 'bg-gold text-white' : 'bg-white text-ink-pale hover:bg-card')}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="bg-card animate-pulse h-16 rounded" />)}</div>
      ) : (
        <div className="bg-white border border-card2 rounded overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card2">
                {['Paciente', 'Procedimento', 'Médico', 'Hospital', 'Data/Hora', 'Duração', 'Valor', 'Status', 'Ação'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-ink-pale text-xs uppercase tracking-widest font-light whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cirurgias.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-ink-pale">
                  <Scissors size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="font-light text-sm">Nenhuma cirurgia encontrada</p>
                </td></tr>
              ) : cirurgias.map((c) => {
                const st = statusMap[c.status] ?? { label: c.status, color: 'text-ink-pale bg-card' }
                return (
                  <tr key={c.id} className="border-b border-card/50 hover:bg-card/20">
                    <td className="px-4 py-3 text-ink font-light whitespace-nowrap">{c.paciente.user.nome}</td>
                    <td className="px-4 py-3 text-ink-pale font-light">{c.procedimento.nome}</td>
                    <td className="px-4 py-3 text-ink-pale font-light whitespace-nowrap">{c.medico.user.nome}</td>
                    <td className="px-4 py-3 text-ink-pale font-light">{c.hospital.nome}</td>
                    <td className="px-4 py-3 text-ink font-light whitespace-nowrap">
                      {formatDate(c.data)}{c.horaInicio ? ` · ${c.horaInicio}` : ''}
                    </td>
                    <td className="px-4 py-3 text-ink-pale">
                      {c.duracaoMin ? `${Math.round(c.duracaoMin / 60)}h${c.duracaoMin % 60 > 0 ? c.duracaoMin % 60 + 'min' : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-pale">{c.valor ? formatCurrency(c.valor) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full', st.color)}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'agendada' && (
                        <button
                          onClick={() => handleStatusChange(c.id, 'realizada')}
                          className="text-xs text-ok hover:underline"
                        >
                          Marcar realizada
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <h2 className="font-serif italic text-xl text-ink">Agendar Cirurgia</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-pale hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { l: 'Paciente *', k: 'pacienteId' as const, opts: pacientes.map((p: any) => ({ v: p.id, l: p.user.nome })) },
                { l: 'Procedimento *', k: 'procedimentoId' as const, opts: procedimentos.map((p: any) => ({ v: p.id, l: p.nome })) },
                { l: 'Médico *', k: 'medicoId' as const, opts: medicos.map((m: any) => ({ v: m.id, l: m.user.nome })) },
                { l: 'Hospital *', k: 'hospitalId' as const, opts: hospitais.map((h: any) => ({ v: h.id, l: h.nome })) },
              ].map(({ l, k, opts }) => (
                <div key={k}>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{l}</label>
                  <select value={formData[k]} onChange={(e) => f(k, e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent">
                    <option value="">Selecionar...</option>
                    {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Data *</label>
                  <input type="date" value={formData.data} onChange={(e) => f('data', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Horário</label>
                  <input type="time" value={formData.horaInicio} onChange={(e) => f('horaInicio', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Duração (min)</label>
                  <input type="number" value={formData.duracaoMin} onChange={(e) => f('duracaoMin', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Valor (R$)</label>
                  <input type="number" value={formData.valor} onChange={(e) => f('valor', e.target.value)} className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Observações</label>
                <textarea rows={2} value={formData.obs} onChange={(e) => f('obs', e.target.value)} className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold resize-none bg-transparent" />
              </div>
              <button onClick={handleSave} className="w-full bg-gold text-white py-2.5 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors">Agendar Cirurgia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
