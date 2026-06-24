'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import SectionHeader from '@/components/SectionHeader'
import PipelineBoard from '@/components/PipelineBoard'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { PlusIcon, EditIcon, TrashIcon, SpinnerIcon } from '@/components/icons'
import type { Lead, Medico, Procedimento } from '@apice/types'

function formatCurrency(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const estagioVariant: Record<string, 'gold' | 'ok' | 'neutral' | 'ink'> = {
  lead: 'neutral',
  consulta: 'gold',
  proposta: 'ink',
  fechamento: 'ok',
}

interface LeadFormData {
  nome: string
  telefone: string
  email: string
  procedimentoId: string
  medicoId: string
  valorEstimado: string
  estagio: string
  obs: string
}

const emptyForm: LeadFormData = {
  nome: '',
  telefone: '',
  email: '',
  procedimentoId: '',
  medicoId: '',
  valorEstimado: '',
  estagio: 'lead',
  obs: '',
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [form, setForm] = useState<LeadFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterMedico, setFilterMedico] = useState('')

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, medicosRes, procsRes] = await Promise.all([
        api.get<{ data: Lead[] }>('/clinic/leads'),
        api.get<{ data: Medico[] }>('/admin/medicos'),
        api.get<{ data: Procedimento[] }>('/admin/procedimentos'),
      ])
      setLeads(leadsRes.data.data ?? [])
      setMedicos(medicosRes.data.data ?? [])
      setProcedimentos(procsRes.data.data ?? [])
    } catch {
      toast.error('Erro ao carregar pipeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  async function handleLeadMove(leadId: string, newEstagio: string) {
    try {
      await api.patch(`/clinic/leads/${leadId}`, { estagio: newEstagio })
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, estagio: newEstagio as Lead['estagio'] } : l))
      toast.success('Lead atualizado')
    } catch {
      toast.error('Erro ao mover lead')
    }
  }

  function openNew() {
    setEditingLead(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setForm({
      nome: lead.nome,
      telefone: lead.telefone ?? '',
      email: lead.email ?? '',
      procedimentoId: lead.procedimentoId ?? '',
      medicoId: lead.medicoId ?? '',
      valorEstimado: lead.valorEstimado?.toString() ?? '',
      estagio: lead.estagio,
      obs: lead.obs ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        nome: form.nome,
        telefone: form.telefone || undefined,
        email: form.email || undefined,
        procedimentoId: form.procedimentoId || undefined,
        medicoId: form.medicoId || undefined,
        valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : undefined,
        estagio: form.estagio,
        obs: form.obs || undefined,
      }
      if (editingLead) {
        await api.patch(`/clinic/leads/${editingLead.id}`, payload)
        toast.success('Lead atualizado')
      } else {
        await api.post('/clinic/leads', payload)
        toast.success('Lead criado')
      }
      setModalOpen(false)
      loadLeads()
    } catch {
      toast.error('Erro ao salvar lead')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lead?')) return
    try {
      await api.delete(`/clinic/leads/${id}`)
      setLeads((prev) => prev.filter((l) => l.id !== id))
      toast.success('Lead removido')
    } catch {
      toast.error('Erro ao excluir lead')
    }
  }

  const filtered = leads.filter((l) => !filterMedico || l.medicoId === filterMedico)

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
        title="Pipeline"
        subtitle="Gestão de leads e conversões"
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-gold text-white-cream px-4 py-2 text-sm font-jost font-light hover:bg-gold-light transition-colors rounded-sm">
            <PlusIcon /> Novo Lead
          </button>
        }
      />

      {/* Board */}
      <PipelineBoard leads={filtered} onLeadMove={handleLeadMove} />

      {/* Table */}
      <div className="mt-10 bg-white-cream border border-card2 rounded-sm">
        <div className="px-6 py-4 border-b border-card2 flex items-center justify-between">
          <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-widest">Todos os Leads</p>
          <select
            value={filterMedico}
            onChange={(e) => setFilterMedico(e.target.value)}
            className="border border-card2 rounded-sm px-2 py-1 text-xs font-jost bg-white-cream text-ink"
          >
            <option value="">Todos os médicos</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>{m.user.nome}</option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-ink-pale font-jost font-light text-sm">
            Nenhum lead encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card2">
                  {['Nome', 'Procedimento', 'Médico', 'Valor Est.', 'Estágio', 'Último Contato', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-jost font-light text-ink-pale uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-card last:border-0 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-jost">{lead.nome}</td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{lead.procedimento?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{lead.medico?.user?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-jost text-gold">{formatCurrency(lead.valorEstimado)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estagioVariant[lead.estagio] ?? 'neutral'}>
                        {lead.estagio.charAt(0).toUpperCase() + lead.estagio.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-jost text-ink-pale">{formatDate(lead.ultimoContato)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(lead)} className="text-ink-pale hover:text-gold transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDelete(lead.id)} className="text-ink-pale hover:text-danger transition-colors"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingLead ? 'Editar Lead' : 'Novo Lead'} size="md">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
              placeholder="Nome completo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
                placeholder="(51) 9 9999-9999"
              />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">E-mail</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
                placeholder="email@email.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Procedimento</label>
              <select
                value={form.procedimentoId}
                onChange={(e) => setForm((f) => ({ ...f, procedimentoId: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
              >
                <option value="">Selecione</option>
                {procedimentos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Médico</label>
              <select
                value={form.medicoId}
                onChange={(e) => setForm((f) => ({ ...f, medicoId: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
              >
                <option value="">Selecione</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.user.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Valor Estimado (R$)</label>
              <input
                type="number"
                value={form.valorEstimado}
                onChange={(e) => setForm((f) => ({ ...f, valorEstimado: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-jost font-light text-ink-pale mb-1">Estágio</label>
              <select
                value={form.estagio}
                onChange={(e) => setForm((f) => ({ ...f, estagio: e.target.value }))}
                className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold"
              >
                <option value="lead">Lead</option>
                <option value="consulta">Consulta</option>
                <option value="proposta">Proposta</option>
                <option value="fechamento">Fechamento</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-jost font-light text-ink-pale mb-1">Observações</label>
            <textarea
              value={form.obs}
              onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
              rows={3}
              className="w-full border border-card2 rounded-sm px-3 py-2 text-sm font-jost bg-white-cream focus:outline-none focus:border-gold resize-none"
              placeholder="Observações sobre o lead..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-jost font-light text-ink-pale border border-card2 rounded-sm hover:border-gold/50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-jost font-light bg-gold text-white-cream rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
              {saving && <SpinnerIcon size={14} />}
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
