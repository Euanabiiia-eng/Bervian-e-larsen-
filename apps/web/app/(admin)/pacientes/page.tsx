'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { PlusIcon, SpinnerIcon } from '@/components/icons'
import type { Paciente, Medico, Procedimento, JornadaEtapa, Documento } from '@apice/types'

interface PatientFormData {
  nome: string; email: string; telefone: string; senha: string
  procedimentoId: string; medicoId: string
  dataCirurgia: string; horaCirurgia: string; valor: string
}

const emptyForm: PatientFormData = {
  nome: '', email: '', telefone: '', senha: '',
  procedimentoId: '', medicoId: '',
  dataCirurgia: '', horaCirurgia: '', valor: '',
}

const statusLabel: Record<string, { label: string; variant: 'gold' | 'ok' | 'neutral' | 'ink' }> = {
  lead: { label: 'Lead', variant: 'neutral' },
  pre_op: { label: 'Pré-op', variant: 'gold' },
  pos_op: { label: 'Pós-op', variant: 'ok' },
  alta: { label: 'Alta', variant: 'ink' },
}

const jornadaStatusColors = {
  done: 'bg-ok text-white-cream',
  active: 'bg-gold text-white-cream',
  pending: 'bg-card2 text-ink-pale',
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailPaciente, setDetailPaciente] = useState<Paciente | null>(null)
  const [form, setForm] = useState<PatientFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMedico, setFilterMedico] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, mRes, procRes] = await Promise.all([
        api.get<{ data: Paciente[] }>('/clinic/pacientes', { params: { status: filterStatus, medicoId: filterMedico } }),
        api.get<{ data: Medico[] }>('/admin/medicos'),
        api.get<{ data: Procedimento[] }>('/admin/procedimentos'),
      ])
      setPacientes(pRes.data.data ?? [])
      setMedicos(mRes.data.data ?? [])
      setProcedimentos(procRes.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterMedico])

  useEffect(() => { load() }, [load])

  function set(field: keyof PatientFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!form.nome || !form.email) { toast.error('Nome e e-mail obrigatórios'); return }
    setSaving(true)
    try {
      await api.post('/clinic/pacientes', {
        nome: form.nome, email: form.email,
        telefone: form.telefone || undefined, senha: form.senha || 'apice2026',
        procedimentoId: form.procedimentoId || undefined,
        medicoId: form.medicoId || undefined,
        dataCirurgia: form.dataCirurgia || undefined,
        horaCirurgia: form.horaCirurgia || undefined,
        valor: form.valor ? parseFloat(form.valor) : undefined,
      })
      toast.success('Paciente criado com sucesso')
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch {
      toast.error('Erro ao criar paciente')
    } finally {
      setSaving(false)
    }
  }

  async function openDetail(p: Paciente) {
    try {
      const res = await api.get<{ data: Paciente }>(`/clinic/pacientes/${p.id}`)
      setDetailPaciente(res.data.data ?? p)
    } catch {
      setDetailPaciente(p)
    }
  }

  const jornadaDone = (jornada?: JornadaEtapa[]) =>
    jornada ? Math.round((jornada.filter((e) => e.status === 'done').length / jornada.length) * 100) : 0

  if (loading) {
    return <div className="flex items-center justify-center h-full"><SpinnerIcon size={32} /></div>
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Pacientes"
        subtitle="Acompanhamento individual da jornada"
        action={
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Novo Paciente
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-card2 rounded-sm px-3 py-1.5 text-sm font-jost bg-white-cream text-ink">
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="pre_op">Pré-op</option>
          <option value="pos_op">Pós-op</option>
          <option value="alta">Alta</option>
        </select>
        <select value={filterMedico} onChange={(e) => setFilterMedico(e.target.value)}
          className="border border-card2 rounded-sm px-3 py-1.5 text-sm font-jost bg-white-cream text-ink">
          <option value="">Todos os médicos</option>
          {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.nome}</option>)}
        </select>
      </div>

      {pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-pale">
          <p className="font-cormorant italic text-2xl mb-2">Nenhum paciente encontrado</p>
          <p className="font-jost font-light text-sm">Ajuste os filtros ou crie um novo paciente.</p>
        </div>
      ) : (
        <div className="bg-white-cream border border-card2 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card2">
                  {['Paciente', 'Procedimento', 'Médico', 'Status', 'Cirurgia', 'Engajamento', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => {
                  const st = statusLabel[p.status] ?? { label: p.status, variant: 'neutral' as const }
                  const pct = jornadaDone(p.jornada)
                  return (
                    <tr key={p.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors cursor-pointer" onClick={() => openDetail(p)}>
                      <td className="px-4 py-3 text-sm font-jost">{p.user.nome}</td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{p.procedimento?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">{p.medico?.user?.nome ?? '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-sm font-jost text-ink-pale">
                        {p.dataCirurgia ? new Date(p.dataCirurgia).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-card2 rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-jost text-ink-pale">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-jost text-gold">Ver detalhes →</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Paciente" size="md">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Nome completo *</label>
              <input value={form.nome} onChange={set('nome')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">E-mail *</label>
              <input type="email" value={form.email} onChange={set('email')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Telefone</label>
              <input value={form.telefone} onChange={set('telefone')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Procedimento</label>
              <select value={form.procedimentoId} onChange={set('procedimentoId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
                <option value="">Selecione</option>
                {procedimentos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Médico</label>
              <select value={form.medicoId} onChange={set('medicoId')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold">
                <option value="">Selecione</option>
                {medicos.map((m) => <option key={m.id} value={m.id}>{m.user.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Data da Cirurgia</label>
              <input type="date" value={form.dataCirurgia} onChange={set('dataCirurgia')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Hora da Cirurgia</label>
              <input type="time" value={form.horaCirurgia} onChange={set('horaCirurgia')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={set('valor')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Senha (padrão: apice2026)</label>
              <input value={form.senha} onChange={set('senha')} className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold" placeholder="apice2026" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-jost font-light text-ink-pale border border-card2 rounded-sm hover:border-gold/50 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-jost font-light bg-gold text-white-cream rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
              {saving && <SpinnerIcon size={14} />} Criar Paciente
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Panel */}
      {detailPaciente && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white-cream border-l border-card2 shadow-2xl z-40 overflow-y-auto">
          <div className="sticky top-0 bg-white-cream border-b border-card2 px-6 py-4 flex items-center justify-between">
            <h2 className="font-cormorant italic text-xl text-ink">{detailPaciente.user.nome}</h2>
            <button onClick={() => setDetailPaciente(null)} className="text-ink-pale hover:text-ink transition-colors text-xl">×</button>
          </div>
          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="space-y-1">
              <p className="text-xs font-jost font-light text-ink-pale">{detailPaciente.procedimento?.nome ?? '—'} · {detailPaciente.medico?.user?.nome ?? '—'}</p>
              {detailPaciente.dataCirurgia && (
                <p className="text-sm font-jost text-gold">
                  Cirurgia: {new Date(detailPaciente.dataCirurgia).toLocaleDateString('pt-BR')} às {detailPaciente.horaCirurgia}
                </p>
              )}
            </div>

            {/* Journey */}
            {detailPaciente.jornada && detailPaciente.jornada.length > 0 && (
              <div>
                <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-3">Jornada</p>
                <div className="space-y-2">
                  {detailPaciente.jornada.sort((a, b) => a.ordem - b.ordem).map((e) => (
                    <div key={e.id} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${jornadaStatusColors[e.status as keyof typeof jornadaStatusColors]}`}>
                        {e.status === 'done' ? '✓' : e.status === 'active' ? '→' : '○'}
                      </div>
                      <div>
                        <p className="text-sm font-jost">{e.label}</p>
                        {e.data && <p className="text-xs font-jost font-light text-ink-pale">{e.data}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {detailPaciente.documentos && detailPaciente.documentos.length > 0 && (
              <div>
                <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-3">Documentos</p>
                <div className="space-y-2">
                  {detailPaciente.documentos.map((d: Documento) => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-card last:border-0">
                      <p className="text-sm font-jost">{d.titulo}</p>
                      <Badge variant={d.status === 'assinado' ? 'ok' : d.status === 'disponivel' ? 'gold' : 'neutral'}>
                        {d.status === 'assinado' ? 'Assinado' : d.status === 'disponivel' ? 'Disponível' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {detailPaciente.checklist && detailPaciente.checklist.length > 0 && (
              <div>
                <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest mb-3">Checklist</p>
                <div className="space-y-2">
                  {detailPaciente.checklist.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${c.feito ? 'bg-ok border-ok' : 'border-card2'}`}>
                        {c.feito && <span className="text-white-cream text-xs">✓</span>}
                      </div>
                      <p className={`text-sm font-jost ${c.feito ? 'line-through text-ink-pale' : 'text-ink'}`}>{c.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
