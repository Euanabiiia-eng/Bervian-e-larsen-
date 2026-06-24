'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { PlusIcon, SpinnerIcon } from '@/components/icons'
import type { Cirurgia, Paciente, Medico, Procedimento, Hospital } from '@apice/types'

interface CirurgiaFormData {
  pacienteId: string; procedimentoId: string; medicoId: string; hospitalId: string
  data: string; horaInicio: string; duracaoMin: string; valor: string; obs: string
}

const emptyForm: CirurgiaFormData = {
  pacienteId: '', procedimentoId: '', medicoId: '', hospitalId: '',
  data: '', horaInicio: '', duracaoMin: '', valor: '', obs: '',
}

type FilterStatus = '' | 'agendada' | 'realizada' | 'cancelada'

const statusConfig: Record<string, { label: string; variant: 'gold' | 'ok' | 'danger' }> = {
  agendada: { label: 'Agendada', variant: 'gold' },
  realizada: { label: 'Realizada', variant: 'ok' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
}

export default function CirurgiasPage() {
  const [cirurgias, setCirurgias] = useState<Cirurgia[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<CirurgiaFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')
  const [confirmRealizadaId, setConfirmRealizadaId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, pRes, mRes, procRes, hRes] = await Promise.all([
        api.get<{ data: Cirurgia[] }>('/clinic/cirurgias', { params: { status: filterStatus || undefined } }),
        api.get<{ data: Paciente[] }>('/clinic/pacientes'),
        api.get<{ data: Medico[] }>('/admin/medicos'),
        api.get<{ data: Procedimento[] }>('/admin/procedimentos'),
        api.get<{ data: Hospital[] }>('/admin/hospitais'),
      ])
      setCirurgias(cRes.data.data ?? [])
      setPacientes(pRes.data.data ?? [])
      setMedicos(mRes.data.data ?? [])
      setProcedimentos(procRes.data.data ?? [])
      setHospitais(hRes.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar cirurgias')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  function set(field: keyof CirurgiaFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!form.pacienteId || !form.procedimentoId || !form.medicoId || !form.hospitalId || !form.data) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      await api.post('/clinic/cirurgias', {
        pacienteId: form.pacienteId, procedimentoId: form.procedimentoId,
        medicoId: form.medicoId, hospitalId: form.hospitalId,
        data: form.data, horaInicio: form.horaInicio || undefined,
        duracaoMin: form.duracaoMin ? parseInt(form.duracaoMin) : undefined,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        obs: form.obs || undefined,
      })
      toast.success('Cirurgia agendada com sucesso')
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch {
      toast.error('Erro ao agendar cirurgia')
    } finally {
      setSaving(false)
    }
  }

  async function markRealizada(id: string) {
    try {
      await api.patch(`/clinic/cirurgias/${id}`, { status: 'realizada' })
      toast.success('Cirurgia marcada como realizada')
      setConfirmRealizadaId(null)
      load()
    } catch {
      toast.error('Erro ao atualizar cirurgia')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><SpinnerIcon size={32} /></div>
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Cirurgias"
        subtitle="Agenda cirúrgica e histórico"
        action={
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Nova Cirurgia
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([['', 'Todas'], ['agendada', 'Agendadas'], ['realizada', 'Realizadas'], ['cancelada', 'Canceladas']] as [FilterStatus, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-3 py-1.5 text-xs font-jost font-light rounded-sm border transition-colors ${
              filterStatus === v ? 'bg-gold text-white-cream border-gold' : 'border-card2 text-ink-pale hover:border-gold/50'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {cirurgias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-pale">
          <p className="font-cormorant italic text-2xl mb-2">Nenhuma cirurgia encontrada</p>
        </div>
      ) : (
        <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card2">
                  {['Paciente', 'Procedimento', 'Médico', 'Hospital', 'Data/Hora', 'Duração', 'Valor', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cirurgias.map((c) => {
                  const st = statusConfig[c.status]
                  return (
                    <tr key={c.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-jost">{(c.paciente as { user?: { nome?: string } })?.user?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.procedimento as { nome?: string })?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.medico as { user?: { nome?: string } })?.user?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{(c.hospital as { nome?: string })?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost">
                        {new Date(c.data).toLocaleDateString('pt-BR')}
                        {c.horaInicio && <span className="text-ink-pale ml-1">às {c.horaInicio}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{c.duracaoMin ? `${c.duracaoMin}min` : '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost text-gold">
                        {c.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.valor) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {st && <Badge variant={st.variant}>{st.label}</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        {c.status === 'agendada' && (
                          <button onClick={() => setConfirmRealizadaId(c.id)}
                            className="text-xs font-jost font-light text-ok hover:underline">
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
        </div>
      )}

      {/* New Surgery Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Cirurgia" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Paciente *</label>
            <select value={form.pacienteId} onChange={set('pacienteId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              <option value="">Selecione</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.user.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Procedimento *</label>
            <select value={form.procedimentoId} onChange={set('procedimentoId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              <option value="">Selecione</option>
              {procedimentos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Médico *</label>
            <select value={form.medicoId} onChange={set('medicoId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              <option value="">Selecione</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Hospital *</label>
            <select value={form.hospitalId} onChange={set('hospitalId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
              <option value="">Selecione</option>
              {hospitais.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Data *</label>
            <input type="date" value={form.data} onChange={set('data')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Hora de Início</label>
            <input type="time" value={form.horaInicio} onChange={set('horaInicio')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Duração (min)</label>
            <input type="number" value={form.duracaoMin} onChange={set('duracaoMin')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Valor (R$)</label>
            <input type="number" value={form.valor} onChange={set('valor')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Observações</label>
            <textarea value={form.obs} onChange={set('obs')} rows={2} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none" />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-jost font-light text-ink-pale border border-card2 rounded-sm hover:border-gold/50 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-jost font-light bg-gold text-white-cream rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
              {saving && <SpinnerIcon size={14} />} Agendar Cirurgia
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm realizada */}
      <Modal open={!!confirmRealizadaId} onClose={() => setConfirmRealizadaId(null)} title="Confirmar Cirurgia" size="sm">
        <p className="font-jost font-light text-sm text-ink mb-6">Confirmar que esta cirurgia foi realizada? Isso atualizará o status do paciente e liberará os documentos pós-operatórios automaticamente.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmRealizadaId(null)} className="px-4 py-2 text-sm font-jost font-light text-ink-pale border border-card2 rounded-sm">Cancelar</button>
          <button onClick={() => confirmRealizadaId && markRealizada(confirmRealizadaId)} className="px-4 py-2 text-sm font-jost font-light bg-ok text-white-cream rounded-sm hover:opacity-90">Confirmar</button>
        </div>
      </Modal>
    </div>
  )
}
