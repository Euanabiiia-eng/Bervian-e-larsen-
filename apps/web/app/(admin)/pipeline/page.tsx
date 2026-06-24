'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@apice/utils'
import { toast } from 'sonner'
import { Plus, X, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

type LeadEstagio = 'lead' | 'consulta' | 'proposta' | 'fechamento'

interface Lead {
  id: string
  nome: string
  telefone?: string | null
  email?: string | null
  estagio: LeadEstagio
  valorEstimado?: number | null
  obs?: string | null
  procedimento?: { id: string; nome: string } | null
  medico?: { id: string; user: { nome: string } } | null
  ultimoContato?: string | null
}

const columns: { key: LeadEstagio; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'consulta', label: 'Consulta' },
  { key: 'proposta', label: 'Proposta' },
  { key: 'fechamento', label: 'Fechamento' },
]

const columnColors: Record<LeadEstagio, string> = {
  lead: 'border-ink-pale/30',
  consulta: 'border-gold-pale/50',
  proposta: 'border-gold/50',
  fechamento: 'border-ok/50',
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [procedimentos, setProcedimentos] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '', telefone: '', email: '', procedimentoId: '', medicoId: '',
    valorEstimado: '', estagio: 'lead' as LeadEstagio, obs: ''
  })

  useEffect(() => {
    loadData()
    api.get('/admin/procedimentos').then((r) => setProcedimentos(r.data.data))
    api.get('/admin/medicos').then((r) => setMedicos(r.data.data))
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await api.get('/clinic/leads')
      setLeads(data.data)
    } catch { toast.error('Erro ao carregar leads') }
    finally { setLoading(false) }
  }

  async function handleMove(lead: Lead, novoEstagio: LeadEstagio) {
    try {
      await api.patch(`/clinic/leads/${lead.id}`, { estagio: novoEstagio })
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, estagio: novoEstagio } : l))
      toast.success('Lead atualizado')
    } catch { toast.error('Erro ao atualizar lead') }
  }

  async function handleSave() {
    try {
      if (selected) {
        const { data } = await api.patch(`/clinic/leads/${selected.id}`, {
          ...formData,
          valorEstimado: formData.valorEstimado ? parseFloat(formData.valorEstimado) : undefined,
        })
        setLeads((prev) => prev.map((l) => l.id === selected.id ? data.data : l))
        toast.success('Lead atualizado')
      } else {
        const { data } = await api.post('/clinic/leads', {
          ...formData,
          valorEstimado: formData.valorEstimado ? parseFloat(formData.valorEstimado) : undefined,
        })
        setLeads((prev) => [...prev, data.data])
        toast.success('Lead criado')
      }
      resetForm()
    } catch { toast.error('Erro ao salvar lead') }
  }

  function resetForm() {
    setShowForm(false)
    setSelected(null)
    setFormData({ nome: '', telefone: '', email: '', procedimentoId: '', medicoId: '', valorEstimado: '', estagio: 'lead', obs: '' })
  }

  function openEdit(lead: Lead) {
    setSelected(lead)
    setFormData({
      nome: lead.nome,
      telefone: lead.telefone ?? '',
      email: lead.email ?? '',
      procedimentoId: lead.procedimento?.id ?? '',
      medicoId: lead.medico?.id ?? '',
      valorEstimado: lead.valorEstimado?.toString() ?? '',
      estagio: lead.estagio,
      obs: lead.obs ?? '',
    })
    setShowForm(true)
  }

  const grouped = columns.reduce((acc, col) => {
    acc[col.key] = leads.filter((l) => l.estagio === col.key)
    return acc
  }, {} as Record<LeadEstagio, Lead[]>)

  const stageOrder: LeadEstagio[] = ['lead', 'consulta', 'proposta', 'fechamento']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Pipeline</h1>
          <p className="text-ink-pale text-sm font-light mt-1">Gestão de leads e conversão</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors"
        >
          <Plus size={14} /> Novo Lead
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {columns.map((c) => (
            <div key={c.key} className="bg-card animate-pulse h-64 rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className={clsx('bg-white border rounded', columnColors[col.key])}>
              <div className="px-4 py-3 border-b border-card2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-ink-pale font-light">{col.label}</span>
                <span className="text-xs text-ink-pale bg-card rounded-full px-2 py-0.5">
                  {grouped[col.key].length}
                </span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {grouped[col.key].map((lead) => {
                  const currentIdx = stageOrder.indexOf(lead.estagio)
                  const nextStage = stageOrder[currentIdx + 1]
                  return (
                    <div
                      key={lead.id}
                      className="bg-white border border-card2 rounded p-3 cursor-pointer hover:border-gold-pale transition-colors"
                      onClick={() => openEdit(lead)}
                    >
                      <p className="text-ink text-sm font-light">{lead.nome}</p>
                      {lead.procedimento && (
                        <p className="text-ink-pale text-xs mt-0.5">{lead.procedimento.nome}</p>
                      )}
                      {lead.valorEstimado && (
                        <p className="text-gold text-xs mt-1">{formatCurrency(lead.valorEstimado)}</p>
                      )}
                      {nextStage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMove(lead, nextStage) }}
                          className="flex items-center gap-1 text-2xs text-ink-pale hover:text-gold mt-2 transition-colors"
                        >
                          <ChevronRight size={10} />
                          {columns.find((c) => c.key === nextStage)?.label}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <h2 className="font-serif italic text-xl text-ink">
                {selected ? 'Editar Lead' : 'Novo Lead'}
              </h2>
              <button onClick={resetForm} className="text-ink-pale hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nome *', key: 'nome', type: 'text' },
                { label: 'Telefone', key: 'telefone', type: 'tel' },
                { label: 'E-mail', key: 'email', type: 'email' },
                { label: 'Valor Estimado (R$)', key: 'valorEstimado', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">{label}</label>
                  <input
                    type={type}
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold transition-colors bg-transparent"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Procedimento</label>
                <select
                  value={formData.procedimentoId}
                  onChange={(e) => setFormData((p) => ({ ...p, procedimentoId: e.target.value }))}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                >
                  <option value="">Selecionar...</option>
                  {procedimentos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Médico</label>
                <select
                  value={formData.medicoId}
                  onChange={(e) => setFormData((p) => ({ ...p, medicoId: e.target.value }))}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                >
                  <option value="">Selecionar...</option>
                  {medicos.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.user.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Estágio</label>
                <select
                  value={formData.estagio}
                  onChange={(e) => setFormData((p) => ({ ...p, estagio: e.target.value as LeadEstagio }))}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                >
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Observações</label>
                <textarea
                  rows={3}
                  value={formData.obs}
                  onChange={(e) => setFormData((p) => ({ ...p, obs: e.target.value }))}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold transition-colors resize-none bg-transparent"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-gold text-white py-2.5 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors mt-2"
              >
                {selected ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
