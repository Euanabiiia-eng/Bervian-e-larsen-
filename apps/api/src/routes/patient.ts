import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { aiService } from '../services/ai.service'
import { logger } from '../lib/logger'

export const patientRouter = Router()

patientRouter.use(authenticate, requireRole('patient'))

// GET /api/patient/me
patientRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({
    where: { userId: req.user!.userId },
    include: {
      user: true,
      procedimento: { include: { hospital: true, videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } } } },
      medico: { include: { user: true } },
      clinic: true,
    },
  })

  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  await prisma.paciente.update({
    where: { id: paciente.id },
    data: { ultimoAcessoApp: new Date() },
  })

  return res.json({ data: paciente })
})

// GET /api/patient/jornada
patientRouter.get('/jornada', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const etapas = await prisma.jornadaEtapa.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { ordem: 'asc' },
  })

  return res.json({ data: etapas })
})

// PATCH /api/patient/jornada/:id
patientRouter.patch('/jornada/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const schema = z.object({
    status: z.enum(['done', 'active', 'pending']).optional(),
    data: z.string().optional(),
    detalhe: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const etapa = await prisma.jornadaEtapa.findFirst({ where: { id, pacienteId: paciente.id } })
  if (!etapa) return res.status(404).json({ error: 'Etapa não encontrada' })

  const updated = await prisma.jornadaEtapa.update({ where: { id }, data: body })
  return res.json({ data: updated })
})

// GET /api/patient/documentos
patientRouter.get('/documentos', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const documentos = await prisma.documento.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { createdAt: 'asc' },
  })

  return res.json({ data: documentos })
})

// GET /api/patient/documentos/:id
patientRouter.get('/documentos/:id', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const doc = await prisma.documento.findFirst({
    where: { id: req.params.id, pacienteId: paciente.id },
  })

  if (!doc) return res.status(404).json({ error: 'Documento não encontrado' })
  if (doc.status === 'pendente') {
    return res.status(403).json({ error: 'Documento ainda não disponível', liberadoEm: doc.liberadoEm })
  }

  return res.json({ data: doc })
})

// GET /api/patient/videos
patientRouter.get('/videos', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({
    where: { userId: req.user!.userId },
    include: { procedimento: true },
  })
  if (!paciente || !paciente.procedimentoId) return res.json({ data: [] })

  const videos = await prisma.procedimentoVideo.findMany({
    where: { procedimentoId: paciente.procedimentoId, ativo: true },
    orderBy: { ordem: 'asc' },
  })

  return res.json({ data: videos })
})

// GET /api/patient/checklist
patientRouter.get('/checklist', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const items = await prisma.checklistItem.findMany({
    where: { pacienteId: paciente.id },
    orderBy: [{ janela: 'asc' }, { ordem: 'asc' }],
  })

  return res.json({ data: items })
})

// PATCH /api/patient/checklist/:id
patientRouter.patch('/checklist/:id', async (req: AuthRequest, res: Response) => {
  const { feito } = z.object({ feito: z.boolean() }).parse(req.body)
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const item = await prisma.checklistItem.findFirst({
    where: { id: req.params.id, pacienteId: paciente.id },
  })
  if (!item) return res.status(404).json({ error: 'Item não encontrado' })

  const updated = await prisma.checklistItem.update({ where: { id: req.params.id }, data: { feito } })
  return res.json({ data: updated })
})

// GET /api/patient/mensagens
patientRouter.get('/mensagens', async (req: AuthRequest, res: Response) => {
  const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.userId } })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const mensagens = await prisma.mensagem.findMany({
    where: {
      pacienteId: paciente.id,
      pendienteAprovacao: false,
    },
    orderBy: { createdAt: 'asc' },
  })

  return res.json({ data: mensagens })
})

// POST /api/patient/mensagens
patientRouter.post('/mensagens', async (req: AuthRequest, res: Response) => {
  const { conteudo } = z.object({ conteudo: z.string().min(1).max(2000) }).parse(req.body)

  const paciente = await prisma.paciente.findUnique({
    where: { userId: req.user!.userId },
    include: {
      procedimento: { include: { hospital: true, respostasIA: { where: { ativo: true } } } },
      medico: { include: { user: true } },
      clinic: true,
      user: true,
    },
  })
  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  // Save patient message
  const patientMsg = await prisma.mensagem.create({
    data: {
      pacienteId: paciente.id,
      clinicId: paciente.clinicId,
      remetente: 'patient',
      conteudo,
      tipo: 'auto',
      pendienteAprovacao: false,
    },
  })

  // Sentiment analysis in background
  aiService.analyzeSentiment(conteudo, paciente.id, paciente.clinicId).catch((e) =>
    logger.error('Sentiment analysis failed', { error: e })
  )

  // Check for critical keywords → needs human approval
  const criticalKeywords = ['cancelar', 'desistir', 'remarcar', 'reagendar', 'complicação', 'preço', 'negociar', 'desconto', 'reembolso', 'emergência', 'urgente']
  const isCritical = criticalKeywords.some((kw) => conteudo.toLowerCase().includes(kw))

  if (isCritical) {
    const sugestao = await aiService.getAIResponse(conteudo, paciente).catch(() => null)
    await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'ai',
        conteudo: 'Nossa equipe foi notificada e entrará em contato em breve. 🌿',
        tipo: 'auto',
        pendienteAprovacao: true,
        sugestaoIA: sugestao,
      },
    })
    return res.status(201).json({ data: patientMsg, aiPending: true })
  }

  // Try quick answer from configured responses
  const quickAnswer = paciente.procedimento
    ? await aiService.findQuickAnswer(conteudo, paciente.procedimento.respostasIA)
    : null

  if (quickAnswer) {
    const aiMsg = await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'ai',
        conteudo: quickAnswer,
        tipo: 'auto',
        pendienteAprovacao: false,
      },
    })
    return res.status(201).json({ data: patientMsg, aiMessage: aiMsg })
  }

  // Fall back to Anthropic API
  try {
    const aiResponse = await aiService.getAIResponse(conteudo, paciente)
    const aiMsg = await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'ai',
        conteudo: aiResponse,
        tipo: 'auto',
        pendienteAprovacao: false,
      },
    })
    return res.status(201).json({ data: patientMsg, aiMessage: aiMsg })
  } catch (err) {
    logger.error('AI response failed, queuing for approval', { error: err })
    const fallbackMsg = await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'ai',
        conteudo: 'Recebemos sua mensagem. Nossa equipe retornará em breve. 🌿',
        tipo: 'auto',
        pendienteAprovacao: true,
        sugestaoIA: null,
      },
    })
    return res.status(201).json({ data: patientMsg, aiMessage: fallbackMsg, aiPending: true })
  }
})
