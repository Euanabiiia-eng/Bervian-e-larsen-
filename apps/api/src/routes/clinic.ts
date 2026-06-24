import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { requireAuth, requireRole } from '../middleware/auth';
import { gerarJornadaPaciente } from '../services/jornada.service';
import { liberarDocumentosPosAlta } from '../services/document.service';

const router = Router();

router.use(requireAuth);
router.use(requireRole('clinic_admin', 'doctor', 'staff'));

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/clinic/dashboard?period=&mes=&ano=
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { mes, ano } = req.query as { period?: string; mes?: string; ano?: string };

    const mesNum = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;
    const anoNum = ano ? parseInt(ano, 10) : new Date().getFullYear();

    const startDate = new Date(anoNum, mesNum - 1, 1);
    const endDate = new Date(anoNum, mesNum, 1);

    const [
      totalPacientes,
      totalLeads,
      totalCirurgias,
      cirurgiasRealizadas,
      receitaAgregada,
      pacientesPreOp,
      pacientesPosOp,
      cirurgiasMes,
      leadsPorEstagio,
    ] = await Promise.all([
      prisma.paciente.count({ where: { clinicId } }),
      prisma.lead.count({ where: { clinicId } }),
      prisma.cirurgia.count({ where: { clinicId } }),
      prisma.cirurgia.count({ where: { clinicId, status: 'realizada' } }),
      prisma.cirurgia.aggregate({
        where: { clinicId, status: 'realizada' },
        _sum: { valor: true },
      }),
      prisma.paciente.count({ where: { clinicId, status: 'pre_op' } }),
      prisma.paciente.count({ where: { clinicId, status: 'pos_op' } }),
      prisma.cirurgia.findMany({
        where: {
          clinicId,
          data: { gte: startDate, lt: endDate },
        },
        include: {
          paciente: { include: { user: { select: { nome: true } } } },
          procedimento: { select: { nome: true } },
          medico: { include: { user: { select: { nome: true } } } },
          hospital: { select: { nome: true } },
        },
        orderBy: { data: 'asc' },
      }),
      prisma.lead.groupBy({
        by: ['estagio'],
        where: { clinicId },
        _count: { estagio: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalPacientes,
          totalLeads,
          totalCirurgias,
          cirurgiasRealizadas,
          receitaTotal: receitaAgregada._sum.valor ?? 0,
          pacientesPreOp,
          pacientesPosOp,
          taxaConversao: totalLeads > 0 ? Math.round((totalPacientes / totalLeads) * 100) : 0,
        },
        cirurgiasMes,
        leadsPorEstagio: leadsPorEstagio.reduce(
          (acc, item) => {
            acc[item.estagio] = item._count.estagio;
            return acc;
          },
          {} as Record<string, number>,
        ),
        periodo: { mes: mesNum, ano: anoNum },
      },
    });
  } catch (err) {
    logger.error(`Erro ao buscar dashboard: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── PACIENTES ────────────────────────────────────────────────────────────────

// GET /api/clinic/pacientes?status=&medicoId=
router.get('/pacientes', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { status, medicoId } = req.query as { status?: string; medicoId?: string };

    const pacientes = await prisma.paciente.findMany({
      where: {
        clinicId,
        ...(status ? { status } : {}),
        ...(medicoId ? { medicoId } : {}),
      },
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        procedimento: { select: { id: true, nome: true, categoria: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: pacientes });
  } catch (err) {
    logger.error(`Erro ao listar pacientes: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic/pacientes
router.post('/pacientes', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const {
      nome,
      email,
      telefone,
      senha,
      procedimentoId,
      medicoId,
      dataCirurgia,
      horaCirurgia,
      valor,
      status,
    } = req.body as {
      nome: string;
      email: string;
      telefone?: string;
      senha?: string;
      procedimentoId?: string;
      medicoId?: string;
      dataCirurgia?: string;
      horaCirurgia?: string;
      valor?: number;
      status?: string;
    };

    const senhaHash = await bcrypt.hash(senha ?? 'apice2026', 10);

    const user = await prisma.user.create({
      data: {
        clinicId,
        nome,
        email,
        senhaHash,
        role: 'patient',
        telefone,
      },
    });

    const paciente = await prisma.paciente.create({
      data: {
        clinicId,
        userId: user.id,
        procedimentoId: procedimentoId ?? null,
        medicoId: medicoId ?? null,
        dataCirurgia: dataCirurgia ? new Date(dataCirurgia) : null,
        horaCirurgia: horaCirurgia ?? null,
        valor: valor ?? null,
        status: status ?? 'pre_op',
      },
      include: {
        user: { select: { id: true, nome: true, email: true } },
        procedimento: true,
        medico: { include: { user: { select: { nome: true } } } },
      },
    });

    if (procedimentoId) {
      await gerarJornadaPaciente(paciente.id, procedimentoId);
    }

    res.status(201).json({ success: true, data: paciente });
  } catch (err) {
    logger.error(`Erro ao criar paciente: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/clinic/pacientes/:id
router.patch('/pacientes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.paciente.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const {
      procedimentoId,
      medicoId,
      dataCirurgia,
      horaCirurgia,
      valor,
      status,
    } = req.body as {
      procedimentoId?: string;
      medicoId?: string;
      dataCirurgia?: string;
      horaCirurgia?: string;
      valor?: number;
      status?: string;
    };

    const updated = await prisma.paciente.update({
      where: { id: req.params.id },
      data: {
        ...(procedimentoId !== undefined ? { procedimentoId } : {}),
        ...(medicoId !== undefined ? { medicoId } : {}),
        ...(dataCirurgia !== undefined ? { dataCirurgia: new Date(dataCirurgia) } : {}),
        ...(horaCirurgia !== undefined ? { horaCirurgia } : {}),
        ...(valor !== undefined ? { valor } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        user: { select: { id: true, nome: true, email: true } },
        procedimento: true,
        medico: { include: { user: { select: { nome: true } } } },
      },
    });

    // Re-generate journey if procedimento changed
    if (
      procedimentoId !== undefined &&
      procedimentoId !== existing.procedimentoId &&
      procedimentoId
    ) {
      await gerarJornadaPaciente(updated.id, procedimentoId);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar paciente: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── LEADS ────────────────────────────────────────────────────────────────────

// GET /api/clinic/leads?estagio=&medicoId=
router.get('/leads', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { estagio, medicoId } = req.query as { estagio?: string; medicoId?: string };

    const leads = await prisma.lead.findMany({
      where: {
        clinicId,
        ...(estagio ? { estagio } : {}),
        ...(medicoId ? { medicoId } : {}),
      },
      include: {
        procedimento: { select: { id: true, nome: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: leads });
  } catch (err) {
    logger.error(`Erro ao listar leads: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic/leads
router.post('/leads', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { nome, telefone, email, procedimentoId, medicoId, valorEstimado, estagio, obs } =
      req.body as {
        nome: string;
        telefone?: string;
        email?: string;
        procedimentoId?: string;
        medicoId?: string;
        valorEstimado?: number;
        estagio?: string;
        obs?: string;
      };

    const lead = await prisma.lead.create({
      data: {
        clinicId,
        nome,
        telefone,
        email,
        procedimentoId,
        medicoId,
        valorEstimado,
        estagio: estagio ?? 'lead',
        obs,
        ultimoContato: new Date(),
      },
      include: {
        procedimento: { select: { id: true, nome: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
      },
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    logger.error(`Erro ao criar lead: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/clinic/leads/:id
router.patch('/leads/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, clinicId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Lead não encontrado' });
      return;
    }

    const { nome, telefone, email, procedimentoId, medicoId, valorEstimado, estagio, obs } =
      req.body as {
        nome?: string;
        telefone?: string;
        email?: string;
        procedimentoId?: string;
        medicoId?: string;
        valorEstimado?: number;
        estagio?: string;
        obs?: string;
      };

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined ? { nome } : {}),
        ...(telefone !== undefined ? { telefone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(procedimentoId !== undefined ? { procedimentoId } : {}),
        ...(medicoId !== undefined ? { medicoId } : {}),
        ...(valorEstimado !== undefined ? { valorEstimado } : {}),
        ...(estagio !== undefined ? { estagio } : {}),
        ...(obs !== undefined ? { obs } : {}),
        ultimoContato: new Date(),
      },
      include: {
        procedimento: { select: { id: true, nome: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar lead: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── CIRURGIAS ────────────────────────────────────────────────────────────────

// GET /api/clinic/cirurgias?status=
router.get('/cirurgias', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { status } = req.query as { status?: string };

    const cirurgias = await prisma.cirurgia.findMany({
      where: {
        clinicId,
        ...(status ? { status } : {}),
      },
      include: {
        paciente: { include: { user: { select: { id: true, nome: true } } } },
        procedimento: { select: { id: true, nome: true, categoria: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
        hospital: { select: { id: true, nome: true, endereco: true } },
      },
      orderBy: { data: 'asc' },
    });

    res.json({ success: true, data: cirurgias });
  } catch (err) {
    logger.error(`Erro ao listar cirurgias: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic/cirurgias
router.post('/cirurgias', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const {
      pacienteId,
      procedimentoId,
      medicoId,
      hospitalId,
      data,
      horaInicio,
      duracaoMin,
      valor,
      obs,
    } = req.body as {
      pacienteId: string;
      procedimentoId: string;
      medicoId: string;
      hospitalId: string;
      data: string;
      horaInicio?: string;
      duracaoMin?: number;
      valor?: number;
      obs?: string;
    };

    const cirurgia = await prisma.cirurgia.create({
      data: {
        clinicId,
        pacienteId,
        procedimentoId,
        medicoId,
        hospitalId,
        data: new Date(data),
        horaInicio,
        duracaoMin,
        valor,
        obs,
        status: 'agendada',
      },
      include: {
        paciente: { include: { user: { select: { id: true, nome: true } } } },
        procedimento: { select: { id: true, nome: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
        hospital: { select: { id: true, nome: true } },
      },
    });

    res.status(201).json({ success: true, data: cirurgia });
  } catch (err) {
    logger.error(`Erro ao criar cirurgia: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/clinic/cirurgias/:id
router.patch('/cirurgias/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.cirurgia.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Cirurgia não encontrada' });
      return;
    }

    const { status, horaInicio, duracaoMin, valor, obs, data, statusPosOp } = req.body as {
      status?: string;
      horaInicio?: string;
      duracaoMin?: number;
      valor?: number;
      obs?: string;
      data?: string;
      statusPosOp?: string;
    };

    const updated = await prisma.cirurgia.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(horaInicio !== undefined ? { horaInicio } : {}),
        ...(duracaoMin !== undefined ? { duracaoMin } : {}),
        ...(valor !== undefined ? { valor } : {}),
        ...(obs !== undefined ? { obs } : {}),
        ...(data !== undefined ? { data: new Date(data) } : {}),
        ...(statusPosOp !== undefined ? { statusPosOp } : {}),
      },
      include: {
        paciente: { include: { user: { select: { id: true, nome: true } } } },
        procedimento: { select: { id: true, nome: true } },
        medico: { include: { user: { select: { id: true, nome: true } } } },
        hospital: { select: { id: true, nome: true } },
      },
    });

    // D+1 logic: if status changed to 'realizada'
    if (status === 'realizada' && existing.status !== 'realizada') {
      await liberarDocumentosPosAlta(updated.pacienteId);
      await prisma.paciente.update({
        where: { id: updated.pacienteId },
        data: { status: 'pos_op' },
      });
      logger.info(`Cirurgia ${updated.id} marcada como realizada — documentos liberados`);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar cirurgia: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── MENSAGENS PENDENTES ──────────────────────────────────────────────────────

// GET /api/clinic/mensagens/pending
router.get('/mensagens/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const mensagens = await prisma.mensagem.findMany({
      where: { clinicId, pendienteAprovacao: true },
      include: {
        paciente: {
          include: { user: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: mensagens });
  } catch (err) {
    logger.error(`Erro ao buscar mensagens pendentes: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic/mensagens/:id/approve
router.post('/mensagens/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const userId = req.user!.id;

    const mensagem = await prisma.mensagem.findFirst({
      where: { id: req.params.id, clinicId, pendienteAprovacao: true },
    });

    if (!mensagem) {
      res.status(404).json({ success: false, error: 'Mensagem não encontrada ou já processada' });
      return;
    }

    const updated = await prisma.mensagem.update({
      where: { id: req.params.id },
      data: {
        pendienteAprovacao: false,
        tipo: 'aprovado',
        aprovadoPorId: userId,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao aprovar mensagem: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic/mensagens/:id/discard
router.post('/mensagens/:id/discard', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const mensagem = await prisma.mensagem.findFirst({
      where: { id: req.params.id, clinicId, pendienteAprovacao: true },
    });

    if (!mensagem) {
      res.status(404).json({ success: false, error: 'Mensagem não encontrada ou já processada' });
      return;
    }

    await prisma.mensagem.update({
      where: { id: req.params.id },
      data: { pendienteAprovacao: false },
    });

    // Create replacement message
    const replacement = await prisma.mensagem.create({
      data: {
        pacienteId: mensagem.pacienteId,
        clinicId,
        remetente: 'sistema',
        conteudo:
          'Nossa equipe retornará em breve. Para urgências ligue para a clínica. 🌿',
        tipo: 'manual',
      },
    });

    res.json({ success: true, data: replacement });
  } catch (err) {
    logger.error(`Erro ao descartar mensagem: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
