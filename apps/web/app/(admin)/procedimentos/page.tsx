'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@apice/utils'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, ChevronDown, Video, PlusCircle } from 'lucide-react'
import clsx from 'clsx'

interface Video {
  id: string
  titulo: string
  url?: string | null
  duracao?: string | null
  descricao?: string | null
  ordem: number
}

interface Procedimento {
  id: string
  nome: string
  categoria: string
  duracaoMin: number
  anestesia: string
  valorBase: number
  internacao: string
  recuperacaoDias: number
  lembrete?: string | null
  descricao?: string | null
  orientacoesPre?: string | null
  orientacoesPos?: string | null
  materiais?: string | null
  complementares?: string | null
  hospital?: { id: string; nome: string } | null
  videos: Video[]
  _count?: { pacientes: number }
}

interface Hospital {
  id: string
  nome: string
  tipo: string
}

const categorias = ['Facial', 'Corporal', 'Mamário', 'Minimamente Invasivo']

const empty = {
  nome: '', categoria: 'Facial', hospitalId: '', duracaoMin: 120, anestesia: 'Geral',
  valorBase: 0, internacao: 'Day Hospital', recuperacaoDias: 14, lembrete: '',
  descricao: '', orientacoesPre: '', orientacoesPos: '', materiais: '', complementares: '',
}

const emptyVideo = { titulo: '', url: '', duracao: '', descricao: '' }

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Procedimento | null>(null)
  const [formData, setFormData] = useState(empty)
  const [videoForm, setVideoForm] = useState(emptyVideo)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    api.get('/admin/hospitais').then((r) => setHospitais(r.data.data))
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/procedimentos')
      setProcedimentos(data.data)
    } catch { toast.error('Erro ao carregar procedimentos') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setSelected(null)
    setFormData(empty)
    setVideoForm(emptyVideo)
    setShowForm(true)
  }

  function openEdit(p: Procedimento) {
    setSelected(p)
    setFormData({
      nome: p.nome, categoria: p.categoria, hospitalId: p.hospital?.id ?? '',
      duracaoMin: p.duracaoMin, anestesia: p.anestesia, valorBase: p.valorBase,
      internacao: p.internacao, recuperacaoDias: p.recuperacaoDias, lembrete: p.lembrete ?? '',
      descricao: p.descricao ?? '', orientacoesPre: p.orientacoesPre ?? '',
      orientacoesPos: p.orientacoesPos ?? '', materiais: p.materiais ?? '',
      complementares: p.complementares ?? '',
    })
    setVideoForm(emptyVideo)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.nome) return toast.error('Nome é obrigatório')
    try {
      const payload = { ...formData, hospitalId: formData.hospitalId || null }
      if (selected) {
        const { data } = await api.patch(`/admin/procedimentos/${selected.id}`, payload)
        setProcedimentos((prev) => prev.map((p) => p.id === selected.id ? { ...data.data, videos: selected.videos } : p))
        toast.success('Procedimento atualizado')
      } else {
        const { data } = await api.post('/admin/procedimentos', payload)
        setProcedimentos((prev) => [...prev, { ...data.data, videos: [] }])
        toast.success('Procedimento criado')
      }
      setShowForm(false)
    } catch { toast.error('Erro ao salvar procedimento') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar este procedimento?')) return
    try {
      await api.delete(`/admin/procedimentos/${id}`)
      setProcedimentos((prev) => prev.filter((p) => p.id !== id))
      toast.success('Procedimento desativado')
    } catch { toast.error('Erro ao desativar') }
  }

  async function addVideo() {
    if (!selected || !videoForm.titulo) return toast.error('Título do vídeo é obrigatório')
    try {
      const { data } = await api.post(`/admin/procedimentos/${selected.id}/videos`, videoForm)
      setProcedimentos((prev) =>
        prev.map((p) => p.id === selected.id ? { ...p, videos: [...p.videos, data.data] } : p)
      )
      setSelected((s) => s ? { ...s, videos: [...s.videos, data.data] } : s)
      setVideoForm(emptyVideo)
      toast.success('Vídeo adicionado')
    } catch { toast.error('Erro ao adicionar vídeo') }
  }

  async function removeVideo(procId: string, videoId: string) {
    try {
      await api.delete(`/admin/procedimentos/${procId}/videos/${videoId}`)
      setProcedimentos((prev) =>
        prev.map((p) => p.id === procId ? { ...p, videos: p.videos.filter((v) => v.id !== videoId) } : p)
      )
      if (selected?.id === procId) {
        setSelected((s) => s ? { ...s, videos: s.videos.filter((v) => v.id !== videoId) } : s)
      }
      toast.success('Vídeo removido')
    } catch { toast.error('Erro ao remover vídeo') }
  }

  const f = (key: keyof typeof formData, val: string | number) =>
    setFormData((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic text-ink">Procedimentos</h1>
          <p className="text-ink-pale text-sm font-light mt-1">Cadastro mestre — propagação automática</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors"
        >
          <Plus size={14} /> Novo Procedimento
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card animate-pulse h-20 rounded" />)}
        </div>
      ) : procedimentos.length === 0 ? (
        <div className="text-center py-16 text-ink-pale">
          <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-light">Nenhum procedimento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {procedimentos.map((p) => (
            <div key={p.id} className="bg-white border border-card2 rounded overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-ink font-light">{p.nome}</h3>
                    <span className="text-2xs uppercase tracking-widest text-ink-pale bg-card px-2 py-0.5 rounded-full">{p.categoria}</span>
                    {p._count && p._count.pacientes > 0 && (
                      <span className="text-2xs text-ok">{p._count.pacientes} paciente(s)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-ink-pale">{Math.round(p.duracaoMin / 60)}h{p.duracaoMin % 60 > 0 ? `${p.duracaoMin % 60}min` : ''}</span>
                    <span className="text-xs text-ink-pale">{p.anestesia}</span>
                    <span className="text-xs text-gold">{formatCurrency(p.valorBase)}</span>
                    {p.hospital && <span className="text-xs text-ink-pale">{p.hospital.nome}</span>}
                    <span className="text-xs text-ink-pale">{p.videos.length} vídeo(s)</span>
                  </div>
                  {p.lembrete && (
                    <p className="text-xs text-ink-pale mt-2 italic">💡 {p.lembrete}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className="text-ink-pale hover:text-ink p-1 transition-colors"
                  >
                    <ChevronDown size={16} className={clsx('transition-transform', expandedId === p.id && 'rotate-180')} />
                  </button>
                  <button onClick={() => openEdit(p)} className="text-ink-pale hover:text-gold p-1 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-ink-pale hover:text-danger p-1 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expandedId === p.id && (
                <div className="border-t border-card2 px-5 py-4 bg-card/30 space-y-4 text-sm">
                  {p.orientacoesPre && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-ink-pale font-light mb-1.5">Orientações Pré-op</p>
                      <p className="text-ink-pale whitespace-pre-line text-xs leading-relaxed line-clamp-3">{p.orientacoesPre}</p>
                    </div>
                  )}
                  {p.videos.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-ink-pale font-light mb-2">Vídeos</p>
                      <div className="space-y-1.5">
                        {p.videos.map((v) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs text-ink-pale">
                            <Video size={12} className="shrink-0" />
                            <span>{v.titulo}</span>
                            {v.duracao && <span>· {v.duracao}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded max-w-2xl w-full my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2 sticky top-0 bg-white z-10">
              <h2 className="font-serif italic text-xl text-ink">
                {selected ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-ink-pale hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Nome *</label>
                  <input
                    value={formData.nome}
                    onChange={(e) => f('nome', e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                    placeholder="Ex: Rinoplastia Primária"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => f('categoria', e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  >
                    {categorias.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Hospital padrão</label>
                  <select
                    value={formData.hospitalId}
                    onChange={(e) => f('hospitalId', e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  >
                    <option value="">Nenhum</option>
                    {hospitais.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Duração (min) *</label>
                  <input
                    type="number"
                    value={formData.duracaoMin}
                    onChange={(e) => f('duracaoMin', parseInt(e.target.value))}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Anestesia</label>
                  <input
                    value={formData.anestesia}
                    onChange={(e) => f('anestesia', e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Valor base (R$)</label>
                  <input
                    type="number"
                    value={formData.valorBase}
                    onChange={(e) => f('valorBase', parseFloat(e.target.value))}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Internação</label>
                  <input
                    value={formData.internacao}
                    onChange={(e) => f('internacao', e.target.value)}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Recuperação (dias)</label>
                  <input
                    type="number"
                    value={formData.recuperacaoDias}
                    onChange={(e) => f('recuperacaoDias', parseInt(e.target.value))}
                    className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Complementares sugeridos</label>
                <input
                  value={formData.complementares}
                  onChange={(e) => f('complementares', e.target.value)}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  placeholder="Ex: Blefaroplastia, Lifting Facial"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Lembrete automático (app do paciente)</label>
                <input
                  value={formData.lembrete}
                  onChange={(e) => f('lembrete', e.target.value)}
                  className="w-full border-b border-card2 py-2 text-ink text-sm outline-none focus:border-gold bg-transparent"
                  placeholder="Ex: Evite sol direto por 30 dias..."
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Descrição para o paciente</label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => f('descricao', e.target.value)}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold transition-colors resize-none bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Orientações Pré-Operatórias</label>
                <textarea
                  rows={6}
                  value={formData.orientacoesPre}
                  onChange={(e) => f('orientacoesPre', e.target.value)}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold transition-colors resize-none bg-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Orientações Pós-Operatórias</label>
                <textarea
                  rows={6}
                  value={formData.orientacoesPos}
                  onChange={(e) => f('orientacoesPos', e.target.value)}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold transition-colors resize-none bg-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-pale mb-1.5 font-light">Materiais / checklist cirúrgico (um por linha)</label>
                <textarea
                  rows={5}
                  value={formData.materiais}
                  onChange={(e) => f('materiais', e.target.value)}
                  className="w-full border border-card2 rounded p-2 text-ink text-sm outline-none focus:border-gold transition-colors resize-none bg-transparent font-mono"
                  placeholder="Micropore hipoalergênico&#10;Soro fisiológico 0,9%&#10;..."
                />
              </div>

              {/* Videos section (only when editing) */}
              {selected && (
                <div className="border-t border-card2 pt-5">
                  <p className="text-xs uppercase tracking-widest text-ink-pale font-light mb-3">Vídeos Vinculados</p>

                  {selected.videos.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {selected.videos.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 p-3 bg-card/50 rounded">
                          <Video size={14} className="text-gold shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink font-light truncate">{v.titulo}</p>
                            {v.duracao && <p className="text-xs text-ink-pale">{v.duracao}</p>}
                          </div>
                          <button
                            onClick={() => removeVideo(selected.id, v.id)}
                            className="text-ink-pale hover:text-danger transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-card/30 rounded p-4 space-y-3">
                    <p className="text-xs text-ink-pale">Adicionar vídeo</p>
                    <input
                      value={videoForm.titulo}
                      onChange={(e) => setVideoForm((v) => ({ ...v, titulo: e.target.value }))}
                      placeholder="Título *"
                      className="w-full border-b border-card2 py-1.5 text-ink text-sm outline-none focus:border-gold bg-transparent"
                    />
                    <input
                      value={videoForm.url}
                      onChange={(e) => setVideoForm((v) => ({ ...v, url: e.target.value }))}
                      placeholder="URL do vídeo"
                      className="w-full border-b border-card2 py-1.5 text-ink text-sm outline-none focus:border-gold bg-transparent"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={videoForm.duracao}
                        onChange={(e) => setVideoForm((v) => ({ ...v, duracao: e.target.value }))}
                        placeholder="Duração (ex: 8:24)"
                        className="border-b border-card2 py-1.5 text-ink text-sm outline-none focus:border-gold bg-transparent"
                      />
                    </div>
                    <input
                      value={videoForm.descricao}
                      onChange={(e) => setVideoForm((v) => ({ ...v, descricao: e.target.value }))}
                      placeholder="Descrição"
                      className="w-full border-b border-card2 py-1.5 text-ink text-sm outline-none focus:border-gold bg-transparent"
                    />
                    <button
                      onClick={addVideo}
                      className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
                    >
                      <PlusCircle size={14} /> Adicionar vídeo
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full bg-gold text-white py-3 text-xs tracking-widest uppercase font-light hover:bg-gold-light transition-colors"
              >
                {selected ? 'Salvar Alterações' : 'Criar Procedimento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookOpen({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
