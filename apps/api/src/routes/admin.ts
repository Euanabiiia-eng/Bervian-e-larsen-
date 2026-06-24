import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

export const adminRouter = Router()

adminRouter.use(authenticate, requireRole('clinic_admin', 'super_admin'))

// ─── Procedimentos ────────────────────────────────────────────────────────────

adminRouter.get('/procedimentos', async (req: AuthRequest, res: Response) => {
  const procedimentos = await prisma.procedimento.findMany({
    where: { clinicId: req.user!.clinicId },
    include: {
      hospital: true,
      videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
      _count: { select: { pacientes: true } },
    },
    orderBy: { nome: 'asc' },
  })

  return res.json({ data: procedimentos })
})

adminRouter.post('/procedimentos', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().min(2),
    categoria: z.enum(['Facial', 'Corporal', 'Mamário', 'Minimamente Invasivo']),
    hospitalId: z.string().optional(),
    duracaoMin: z.number().int().min(30).default(120),
    anestesia: z.string().default('Geral'),
    valorBase: z.number().min(0).default(0),
    internacao: z.string().default('Day Hospital'),
    recuperacaoDias: z.number().int().min(0).default(14),
    descricao: z.string().optional(),
    lembrete: z.string().optional(),
    orientacoesPre: z.string().optional(),
    orientacoesPos: z.string().optional(),
    materiais: z.string().optional(),
    complementares: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const proc = await prisma.procedimento.create({
    data: { clinicId: req.user!.clinicId, ...body },
    include: { hospital: true, videos: true },
  })

  return res.status(201).json({ data: proc })
})

adminRouter.get('/procedimentos/:id', async (req: AuthRequest, res: Response) => {
  const proc = await prisma.procedimento.findFirst({
    where: { id: req.params.id, clinicId: req.user!.clinicId },
    include: {
      hospital: true,
      videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
      respostasIA: { where: { ativo: true } },
      _count: { select: { pacientes: true } },
    },
  })

  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })
  return res.json({ data: proc })
})

adminRouter.patch('/procedimentos/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().optional(),
    categoria: z.enum(['Facial', 'Corporal', 'Mamário', 'Minimamente Invasivo']).optional(),
    hospitalId: z.string().nullable().optional(),
    duracaoMin: z.number().int().optional(),
    anestesia: z.string().optional(),
    valorBase: z.number().optional(),
    internacao: z.string().optional(),
    recuperacaoDias: z.number().int().optional(),
    descricao: z.string().optional(),
    lembrete: z.string().optional(),
    orientacoesPre: z.string().optional(),
    orientacoesPos: z.string().optional(),
    materiais: z.string().optional(),
    complementares: z.string().optional(),
    ativo: z.boolean().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const proc = await prisma.procedimento.findFirst({ where: { id: req.params.id, clinicId } })
  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })

  const updated = await prisma.procedimento.update({
    where: { id: req.params.id },
    data: body,
    include: { hospital: true, videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
  })

  return res.json({ data: updated })
})

adminRouter.delete('/procedimentos/:id', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const proc = await prisma.procedimento.findFirst({ where: { id: req.params.id, clinicId } })
  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })

  await prisma.procedimento.update({ where: { id: req.params.id }, data: { ativo: false } })
  return res.json({ data: { message: 'Procedimento desativado' } })
})

// Videos
adminRouter.post('/procedimentos/:id/videos', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    titulo: z.string().min(2),
    url: z.string().url().optional(),
    duracao: z.string().optional(),
    descricao: z.string().optional(),
    ordem: z.number().int().default(0),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const proc = await prisma.procedimento.findFirst({ where: { id: req.params.id, clinicId } })
  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })

  const video = await prisma.procedimentoVideo.create({
    data: { procedimentoId: req.params.id, ...body },
  })

  return res.status(201).json({ data: video })
})

adminRouter.delete('/procedimentos/:id/videos/:videoId', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const proc = await prisma.procedimento.findFirst({ where: { id: req.params.id, clinicId } })
  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })

  await prisma.procedimentoVideo.update({
    where: { id: req.params.videoId },
    data: { ativo: false },
  })

  return res.json({ data: { message: 'Vídeo removido' } })
})

// ─── Hospitais ────────────────────────────────────────────────────────────────

adminRouter.get('/hospitais', async (req: AuthRequest, res: Response) => {
  const hospitais = await prisma.hospital.findMany({
    where: { clinicId: req.user!.clinicId, ativo: true },
    orderBy: { nome: 'asc' },
  })

  return res.json({ data: hospitais })
})

adminRouter.post('/hospitais', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().min(2),
    tipo: z.enum(['Hospital', 'Day Hospital', 'Centro Cirúrgico']),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    telefone: z.string().optional(),
    contato: z.string().optional(),
    obs: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const hospital = await prisma.hospital.create({
    data: { clinicId: req.user!.clinicId, ...body },
  })

  return res.status(201).json({ data: hospital })
})

adminRouter.get('/hospitais/:id', async (req: AuthRequest, res: Response) => {
  const hospital = await prisma.hospital.findFirst({
    where: { id: req.params.id, clinicId: req.user!.clinicId },
  })

  if (!hospital) return res.status(404).json({ error: 'Hospital não encontrado' })
  return res.json({ data: hospital })
})

adminRouter.patch('/hospitais/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().optional(),
    tipo: z.enum(['Hospital', 'Day Hospital', 'Centro Cirúrgico']).optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    telefone: z.string().optional(),
    contato: z.string().optional(),
    obs: z.string().optional(),
    ativo: z.boolean().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const hospital = await prisma.hospital.findFirst({ where: { id: req.params.id, clinicId } })
  if (!hospital) return res.status(404).json({ error: 'Hospital não encontrado' })

  const updated = await prisma.hospital.update({ where: { id: req.params.id }, data: body })
  return res.json({ data: updated })
})

adminRouter.delete('/hospitais/:id', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const hospital = await prisma.hospital.findFirst({ where: { id: req.params.id, clinicId } })
  if (!hospital) return res.status(404).json({ error: 'Hospital não encontrado' })

  await prisma.hospital.update({ where: { id: req.params.id }, data: { ativo: false } })
  return res.json({ data: { message: 'Hospital desativado' } })
})

// ─── Médicos ──────────────────────────────────────────────────────────────────

adminRouter.get('/medicos', async (req: AuthRequest, res: Response) => {
  const medicos = await prisma.medico.findMany({
    where: { clinicId: req.user!.clinicId, ativo: true },
    include: {
      user: true,
      _count: { select: { pacientes: true, cirurgias: true } },
    },
    orderBy: { user: { nome: 'asc' } },
  })

  return res.json({ data: medicos })
})

adminRouter.post('/medicos', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    telefone: z.string().optional(),
    crm: z.string().min(5),
    especialidade: z.string().min(3),
    formacao: z.string().optional(),
    bio: z.string().optional(),
    agenda: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const senhaHash = await require('bcryptjs').hash('apice2026', 12)

  const user = await prisma.user.create({
    data: {
      clinicId,
      nome: body.nome,
      email: body.email,
      senhaHash,
      role: 'doctor',
      telefone: body.telefone,
    },
  })

  const medico = await prisma.medico.create({
    data: {
      clinicId,
      userId: user.id,
      crm: body.crm,
      especialidade: body.especialidade,
      formacao: body.formacao,
      bio: body.bio,
      agenda: body.agenda,
    },
    include: { user: true },
  })

  return res.status(201).json({ data: medico })
})

adminRouter.patch('/medicos/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    crm: z.string().optional(),
    especialidade: z.string().optional(),
    formacao: z.string().optional(),
    bio: z.string().optional(),
    agenda: z.string().optional(),
    ativo: z.boolean().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const medico = await prisma.medico.findFirst({ where: { id: req.params.id, clinicId } })
  if (!medico) return res.status(404).json({ error: 'Médico não encontrado' })

  const updated = await prisma.medico.update({
    where: { id: req.params.id },
    data: body,
    include: { user: true },
  })

  return res.json({ data: updated })
})

adminRouter.delete('/medicos/:id', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const medico = await prisma.medico.findFirst({ where: { id: req.params.id, clinicId } })
  if (!medico) return res.status(404).json({ error: 'Médico não encontrado' })

  await prisma.medico.update({ where: { id: req.params.id }, data: { ativo: false } })
  return res.json({ data: { message: 'Médico desativado' } })
})

// ─── Respostas IA ─────────────────────────────────────────────────────────────

adminRouter.get('/respostas-ia', async (req: AuthRequest, res: Response) => {
  const { procedimentoId } = req.query
  const where: Record<string, unknown> = {}
  if (procedimentoId) where.procedimentoId = procedimentoId

  const respostas = await prisma.respostaIA.findMany({
    where: { ...where, ativo: true, procedimento: { clinicId: req.user!.clinicId } },
    include: { procedimento: { select: { id: true, nome: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return res.json({ data: respostas })
})

adminRouter.post('/respostas-ia', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    procedimentoId: z.string(),
    palavrasChave: z.string().min(2),
    resposta: z.string().min(10),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const proc = await prisma.procedimento.findFirst({
    where: { id: body.procedimentoId, clinicId },
  })
  if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' })

  const resposta = await prisma.respostaIA.create({ data: body })
  return res.status(201).json({ data: resposta })
})

adminRouter.patch('/respostas-ia/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    palavrasChave: z.string().optional(),
    resposta: z.string().optional(),
    ativo: z.boolean().optional(),
  })

  const body = schema.parse(req.body)
  const updated = await prisma.respostaIA.update({ where: { id: req.params.id }, data: body })
  return res.json({ data: updated })
})

adminRouter.delete('/respostas-ia/:id', async (req: AuthRequest, res: Response) => {
  await prisma.respostaIA.update({ where: { id: req.params.id }, data: { ativo: false } })
  return res.json({ data: { message: 'Resposta desativada' } })
})
