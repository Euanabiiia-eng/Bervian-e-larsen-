import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { jornadaService } from '../services/jornada.service'

export const clinicRouter = Router()

clinicRouter.use(authenticate, requireRole('clinic_admin', 'doctor', 'staff'))

// GET /api/clinic/dashboard
clinicRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const { period = 'mes', mes, ano } = req.query

  const now = new Date()
  const currentYear = ano ? parseInt(ano as string) : now.getFullYear()
  const currentMonth = mes ? parseInt(mes as string) - 1 : now.getMonth()

  let startDate: Date
  let endDate: Date
  let prevStartDate: Date
  let prevEndDate: Date

  if (period === 'semana') {
    const dayOfWeek = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - dayOfWeek)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
    prevStartDate = new Date(startDate)
    prevStartDate.setDate(startDate.getDate() - 7)
    prevEndDate = new Date(startDate)
    prevEndDate.setMilliseconds(-1)
  } else if (period === 'trimestre') {
    const quarter = Math.floor(currentMonth / 3)
    startDate = new Date(currentYear, quarter * 3, 1)
    endDate = new Date(currentYear, quarter * 3 + 3, 0, 23, 59, 59, 999)
    prevStartDate = new Date(currentYear, quarter * 3 - 3, 1)
    prevEndDate = new Date(startDate)
    prevEndDate.setMilliseconds(-1)
  } else if (period === 'ano') {
    startDate = new Date(currentYear, 0, 1)
    endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999)
    prevStartDate = new Date(currentYear - 1, 0, 1)
    prevEndDate = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999)
  } else {
    // mes (default)
    startDate = new Date(currentYear, currentMonth, 1)
    endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
    prevStartDate = new Date(currentYear, currentMonth - 1, 1)
    prevEndDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
  }

  const [
    cirurgiasAtual,
    cirurgiasPrev,
    leadsAbertos,
    leadsPrev,
    leadsFechamento,
    cirurgiasAgendadas,
    cirurgiasAgendadasPrev,
  ] = await Promise.all([
    prisma.cirurgia.findMany({
      where: { clinicId, data: { gte: startDate, lte: endDate }, status: 'realizada' },
    }),
    prisma.cirurgia.findMany({
      where: { clinicId, data: { gte: prevStartDate, lte: prevEndDate }, status: 'realizada' },
    }),
    prisma.lead.count({ where: { clinicId, estagio: { notIn: ['fechamento'] } } }),
    prisma.lead.count({ where: { clinicId, createdAt: { gte: prevStartDate, lte: prevEndDate } } }),
    prisma.lead.findMany({
      where: { clinicId, estagio: 'fechamento' },
      select: { valorEstimado: true },
    }),
    prisma.cirurgia.count({ where: { clinicId, status: 'agendada', data: { gte: now } } }),
    prisma.cirurgia.count({
      where: { clinicId, status: 'agendada', data: { gte: prevStartDate, lte: prevEndDate } },
    }),
  ])

  const receita = cirurgiasAtual.reduce((s, c) => s + (c.valor ?? 0), 0)
  const receitaPrev = cirurgiasPrev.reduce((s, c) => s + (c.valor ?? 0), 0)
  const ticketMedio = cirurgiasAtual.length > 0 ? receita / cirurgiasAtual.length : 0
  const fechamentoValor = leadsFechamento.reduce((s, l) => s + (l.valorEstimado ?? 0), 0)

  // Total leads created in period for conversion rate
  const totalLeadsCreated = await prisma.lead.count({
    where: { clinicId, createdAt: { gte: startDate, lte: endDate } },
  })
  const fechados = await prisma.lead.count({
    where: { clinicId, estagio: 'fechamento', updatedAt: { gte: startDate, lte: endDate } },
  })
  const taxaConversao = totalLeadsCreated > 0 ? Math.round((fechados / totalLeadsCreated) * 100) : 0

  function pct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  // Charts: last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const cirurgiasChart = await prisma.cirurgia.findMany({
    where: { clinicId, data: { gte: sixMonthsAgo }, status: 'realizada' },
    select: { data: true, valor: true },
  })

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const chartMap: Record<string, { total: number; receita: number }> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`
    chartMap[key] = { total: 0, receita: 0 }
  }

  for (const c of cirurgiasChart) {
    const d = new Date(c.data)
    const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`
    if (chartMap[key]) {
      chartMap[key].total++
      chartMap[key].receita += c.valor ?? 0
    }
  }

  // Upcoming surgeries
  const proximasCirurgias = await prisma.cirurgia.findMany({
    where: { clinicId, status: 'agendada', data: { gte: now } },
    include: {
      paciente: { include: { user: true } },
      procedimento: true,
      medico: { include: { user: true } },
      hospital: true,
    },
    orderBy: { data: 'asc' },
    take: 10,
  })

  return res.json({
    data: {
      kpis: {
        atendimentos: cirurgiasAtual.length,
        atendimentosVar: pct(cirurgiasAtual.length, cirurgiasPrev.length),
        leadsAbertos,
        leadsVar: pct(leadsAbertos, leadsPrev),
        leadsFechamento: { count: leadsFechamento.length, valor: fechamentoValor },
        cirurgiasAgendadas,
        cirurgiasVar: pct(cirurgiasAgendadas, cirurgiasAgendadasPrev),
        receita,
        receitaVar: pct(receita, receitaPrev),
        ticketMedio: Math.round(ticketMedio),
        taxaConversao,
        npsScore: 94, // TODO: implement NPS model
      },
      charts: {
        cirurgiasMes: Object.entries(chartMap).map(([mes, v]) => ({ mes, total: v.total })),
        receitaMes: Object.entries(chartMap).map(([mes, v]) => ({ mes, total: v.receita })),
      },
      proximasCirurgias,
    },
  })
})

// GET /api/clinic/pacientes
clinicRouter.get('/pacientes', async (req: AuthRequest, res: Response) => {
  const { status, medicoId } = req.query
  const where: Record<string, unknown> = { clinicId: req.user!.clinicId }
  if (status) where.status = status
  if (medicoId) where.medicoId = medicoId

  const pacientes = await prisma.paciente.findMany({
    where,
    include: {
      user: true,
      procedimento: { select: { id: true, nome: true, categoria: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ data: pacientes })
})

// POST /api/clinic/pacientes
clinicRouter.post('/pacientes', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    telefone: z.string().optional(),
    procedimentoId: z.string().optional(),
    medicoId: z.string().optional(),
    dataCirurgia: z.string().optional(),
    horaCirurgia: z.string().optional(),
    valor: z.number().optional(),
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
      role: 'patient',
      telefone: body.telefone,
    },
  })

  const paciente = await prisma.paciente.create({
    data: {
      clinicId,
      userId: user.id,
      procedimentoId: body.procedimentoId,
      medicoId: body.medicoId,
      dataCirurgia: body.dataCirurgia ? new Date(body.dataCirurgia) : undefined,
      horaCirurgia: body.horaCirurgia,
      valor: body.valor,
    },
    include: { user: true },
  })

  // Auto-generate journey if procedure is set
  if (body.procedimentoId) {
    await jornadaService.gerarJornadaPaciente(paciente.id, body.procedimentoId).catch(() => null)
  }

  return res.status(201).json({ data: paciente })
})

// PATCH /api/clinic/pacientes/:id
clinicRouter.patch('/pacientes/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.string().optional(),
    procedimentoId: z.string().optional(),
    medicoId: z.string().optional(),
    dataCirurgia: z.string().optional(),
    horaCirurgia: z.string().optional(),
    valor: z.number().optional(),
    scoreEngajamento: z.number().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const paciente = await prisma.paciente.findFirst({
    where: { id: req.params.id, clinicId },
  })

  if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' })

  const hadProcedimento = paciente.procedimentoId
  const updated = await prisma.paciente.update({
    where: { id: req.params.id },
    data: {
      ...body,
      dataCirurgia: body.dataCirurgia ? new Date(body.dataCirurgia) : undefined,
    },
    include: { user: true, procedimento: true, medico: { include: { user: true } } },
  })

  // Re-generate journey if procedure changed
  if (body.procedimentoId && body.procedimentoId !== hadProcedimento) {
    await jornadaService.gerarJornadaPaciente(updated.id, body.procedimentoId).catch(() => null)
  }

  return res.json({ data: updated })
})

// GET /api/clinic/leads
clinicRouter.get('/leads', async (req: AuthRequest, res: Response) => {
  const { estagio, medicoId } = req.query
  const where: Record<string, unknown> = { clinicId: req.user!.clinicId }
  if (estagio) where.estagio = estagio
  if (medicoId) where.medicoId = medicoId

  const leads = await prisma.lead.findMany({
    where,
    include: {
      procedimento: { select: { id: true, nome: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return res.json({ data: leads })
})

// POST /api/clinic/leads
clinicRouter.post('/leads', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().min(2),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    procedimentoId: z.string().optional(),
    medicoId: z.string().optional(),
    valorEstimado: z.number().optional(),
    estagio: z.enum(['lead', 'consulta', 'proposta', 'fechamento']).default('lead'),
    obs: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const lead = await prisma.lead.create({
    data: { clinicId: req.user!.clinicId, ...body, ultimoContato: new Date() },
    include: {
      procedimento: { select: { id: true, nome: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
    },
  })

  return res.status(201).json({ data: lead })
})

// PATCH /api/clinic/leads/:id
clinicRouter.patch('/leads/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nome: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    procedimentoId: z.string().optional(),
    medicoId: z.string().optional(),
    valorEstimado: z.number().optional(),
    estagio: z.enum(['lead', 'consulta', 'proposta', 'fechamento']).optional(),
    obs: z.string().optional(),
    ultimoContato: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const lead = await prisma.lead.findFirst({ where: { id: req.params.id, clinicId } })
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' })

  const updated = await prisma.lead.update({
    where: { id: req.params.id },
    data: {
      ...body,
      ultimoContato: body.ultimoContato ? new Date(body.ultimoContato) : new Date(),
    },
    include: {
      procedimento: { select: { id: true, nome: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
    },
  })

  return res.json({ data: updated })
})

// GET /api/clinic/cirurgias
clinicRouter.get('/cirurgias', async (req: AuthRequest, res: Response) => {
  const { status } = req.query
  const where: Record<string, unknown> = { clinicId: req.user!.clinicId }
  if (status) where.status = status

  const cirurgias = await prisma.cirurgia.findMany({
    where,
    include: {
      paciente: { include: { user: true } },
      procedimento: { select: { id: true, nome: true, duracaoMin: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
      hospital: true,
    },
    orderBy: { data: 'asc' },
  })

  return res.json({ data: cirurgias })
})

// POST /api/clinic/cirurgias
clinicRouter.post('/cirurgias', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    pacienteId: z.string(),
    procedimentoId: z.string(),
    medicoId: z.string(),
    hospitalId: z.string(),
    data: z.string(),
    horaInicio: z.string().optional(),
    duracaoMin: z.number().optional(),
    valor: z.number().optional(),
    obs: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const cirurgia = await prisma.cirurgia.create({
    data: { clinicId, ...body, data: new Date(body.data) },
    include: {
      paciente: { include: { user: true } },
      procedimento: { select: { id: true, nome: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
      hospital: true,
    },
  })

  // Update patient surgery date
  await prisma.paciente.update({
    where: { id: body.pacienteId },
    data: {
      dataCirurgia: new Date(body.data),
      horaCirurgia: body.horaInicio,
      medicoId: body.medicoId,
      procedimentoId: body.procedimentoId,
    },
  })

  return res.status(201).json({ data: cirurgia })
})

// PATCH /api/clinic/cirurgias/:id
clinicRouter.patch('/cirurgias/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(['agendada', 'realizada', 'cancelada']).optional(),
    horaInicio: z.string().optional(),
    duracaoMin: z.number().optional(),
    valor: z.number().optional(),
    obs: z.string().optional(),
    statusPosOp: z.string().optional(),
  })

  const body = schema.parse(req.body)
  const clinicId = req.user!.clinicId

  const cirurgia = await prisma.cirurgia.findFirst({ where: { id: req.params.id, clinicId } })
  if (!cirurgia) return res.status(404).json({ error: 'Cirurgia não encontrada' })

  const updated = await prisma.cirurgia.update({
    where: { id: req.params.id },
    data: body,
    include: {
      paciente: { include: { user: true } },
      procedimento: { select: { id: true, nome: true } },
      medico: { include: { user: { select: { id: true, nome: true } } } },
      hospital: true,
    },
  })

  return res.json({ data: updated })
})

// GET /api/clinic/mensagens/pending
clinicRouter.get('/mensagens/pending', async (req: AuthRequest, res: Response) => {
  const mensagens = await prisma.mensagem.findMany({
    where: { clinicId: req.user!.clinicId, pendienteAprovacao: true },
    include: {
      paciente: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return res.json({ data: mensagens })
})

// GET /api/clinic/mensagens/historico
clinicRouter.get('/mensagens/historico', async (req: AuthRequest, res: Response) => {
  const mensagens = await prisma.mensagem.findMany({
    where: { clinicId: req.user!.clinicId, pendienteAprovacao: false },
    include: {
      paciente: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return res.json({ data: mensagens })
})

// POST /api/clinic/mensagens/:id/approve
clinicRouter.post('/mensagens/:id/approve', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const mensagem = await prisma.mensagem.findFirst({ where: { id: req.params.id, clinicId } })
  if (!mensagem) return res.status(404).json({ error: 'Mensagem não encontrada' })

  const { textoFinal } = z.object({ textoFinal: z.string().optional() }).parse(req.body)

  const updated = await prisma.mensagem.update({
    where: { id: req.params.id },
    data: {
      pendienteAprovacao: false,
      tipo: 'aprovado',
      conteudo: textoFinal ?? mensagem.sugestaoIA ?? mensagem.conteudo,
      aprovadoPorId: req.user!.userId,
    },
  })

  return res.json({ data: updated })
})

// POST /api/clinic/mensagens/:id/discard
clinicRouter.post('/mensagens/:id/discard', async (req: AuthRequest, res: Response) => {
  const clinicId = req.user!.clinicId
  const mensagem = await prisma.mensagem.findFirst({ where: { id: req.params.id, clinicId } })
  if (!mensagem) return res.status(404).json({ error: 'Mensagem não encontrada' })

  await prisma.mensagem.update({
    where: { id: req.params.id },
    data: {
      pendienteAprovacao: false,
      tipo: 'aprovado',
      conteudo: 'Nossa equipe analisou sua mensagem e entrará em contato em breve. 🌿',
      aprovadoPorId: req.user!.userId,
    },
  })

  return res.json({ data: { message: 'Mensagem descartada — resposta padrão enviada' } })
})
