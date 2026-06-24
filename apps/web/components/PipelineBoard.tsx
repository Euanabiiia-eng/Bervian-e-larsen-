'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { Lead } from '@apice/types'

const ESTAGIOS = [
  { id: 'lead', label: 'Lead' },
  { id: 'consulta', label: 'Consulta' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'fechamento', label: 'Fechamento' },
]

function formatCurrency(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white-cream border border-card2 rounded-sm p-3 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-lg opacity-50' : 'hover:border-gold/40'
      }`}
    >
      <p className="font-jost font-light text-sm text-ink">{lead.nome}</p>
      {lead.procedimento && (
        <p className="font-jost font-light text-xs text-ink-pale mt-0.5">{lead.procedimento.nome}</p>
      )}
      {lead.valorEstimado && (
        <p className="font-jost text-xs text-gold mt-1">{formatCurrency(lead.valorEstimado)}</p>
      )}
    </div>
  )
}

function Column({ estagio, leads }: { estagio: typeof ESTAGIOS[0]; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio.id })

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-jost font-light text-ink-pale uppercase tracking-wider">{estagio.label}</p>
        <span className="text-xs font-jost text-ink-pale bg-card2 px-1.5 py-0.5 rounded-sm">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-sm border-2 border-dashed transition-colors p-2 flex flex-col gap-2 ${
          isOver ? 'border-gold/60 bg-gold/5' : 'border-card2'
        }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs font-jost font-light text-ink-pale/50 py-8">
            Arraste um lead aqui
          </div>
        )}
      </div>
    </div>
  )
}

interface PipelineBoardProps {
  leads: Lead[]
  onLeadMove: (leadId: string, newEstagio: string) => Promise<void>
}

export default function PipelineBoard({ leads, onLeadMove }: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const activeLead = leads.find((l) => l.id === activeId)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.estagio === over.id) return
    await onLeadMove(lead.id, over.id as string)
  }

  const leadsByEstagio = (estagio: string) => leads.filter((l) => l.estagio === estagio)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {ESTAGIOS.map((e) => (
          <Column key={e.id} estagio={e} leads={leadsByEstagio(e.id)} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="bg-white-cream border border-gold/40 rounded-sm p-3 shadow-xl cursor-grabbing">
            <p className="font-jost font-light text-sm text-ink">{activeLead.nome}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
