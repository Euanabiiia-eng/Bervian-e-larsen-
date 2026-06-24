import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { requireAuth, requireRole } from '../middleware/auth';
import { handlePatientMessage, analyzeSentiment } from '../services/ai.service';

const router = Router();

router.use(requireAuth);
router.use(requireRole('patient'));

// GET /api/patient/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const paciente = await prisma.paciente.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        procedimento: {
          include: { hospital: true },
        },
        medico: {
          include: { user: { select: { id: true, nome: true, email: true } } },
        },
        clinic: { select: { id: true, nome: true, logoUrl: true, corPrimaria: true, corSecundaria: true } },
      },
    });

    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    res.json({ success: true, data: paciente });
  } catch (err) {
    logger.error(`Erro ao buscar paciente: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/jornada
router.get('/jornada', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const etapas = await prisma.jornadaEtapa.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { ordem: 'asc' },
    });

    res.json({ success: true, data: etapas });
  } catch (err) {
    logger.error(`Erro ao buscar jornada: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/patient/jornada/:id
router.patch('/jornada/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const etapa = await prisma.jornadaEtapa.findFirst({
      where: { id: req.params.id, pacienteId: paciente.id },
    });

    if (!etapa) {
      res.status(404).json({ success: false, error: 'Etapa não encontrada' });
      return;
    }

    const { status, data } = req.body as { status?: string; data?: string };

    const updated = await prisma.jornadaEtapa.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(data !== undefined ? { data } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar etapa: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/documentos
router.get('/documentos', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const documentos = await prisma.documento.findMany({
      where: { pacienteId: paciente.id },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        status: true,
        liberadoEm: true,
        urlArquivo: true,
        createdAt: true,
        updatedAt: true,
        // Hide conteudo for pendente documents
        conteudo: false,
      },
    });

    // Add conteudo only for available documents
    const docs = await prisma.documento.findMany({
      where: { pacienteId: paciente.id },
    });

    const result = docs.map((doc) => ({
      id: doc.id,
      tipo: doc.tipo,
      titulo: doc.titulo,
      status: doc.status,
      liberadoEm: doc.liberadoEm,
      urlArquivo: doc.urlArquivo,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      conteudo: doc.status === 'pendente' ? null : doc.conteudo,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Erro ao buscar documentos: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/documentos/:id
router.get('/documentos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const doc = await prisma.documento.findFirst({
      where: { id: req.params.id, pacienteId: paciente.id },
    });

    if (!doc) {
      res.status(404).json({ success: false, error: 'Documento não encontrado' });
      return;
    }

    if (doc.status === 'pendente') {
      res.status(403).json({ success: false, error: 'Documento ainda não disponível' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error(`Erro ao buscar documento: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/videos
router.get('/videos', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { userId: req.user!.id },
      select: { procedimentoId: true },
    });

    if (!paciente?.procedimentoId) {
      res.json({ success: true, data: [] });
      return;
    }

    const videos = await prisma.procedimentoVideo.findMany({
      where: { procedimentoId: paciente.procedimentoId, ativo: true },
      orderBy: { ordem: 'asc' },
    });

    res.json({ success: true, data: videos });
  } catch (err) {
    logger.error(`Erro ao buscar vídeos: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/checklist
router.get('/checklist', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const items = await prisma.checklistItem.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { ordem: 'asc' },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    logger.error(`Erro ao buscar checklist: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/patient/checklist/:id
router.patch('/checklist/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const item = await prisma.checklistItem.findFirst({
      where: { id: req.params.id, pacienteId: paciente.id },
    });

    if (!item) {
      res.status(404).json({ success: false, error: 'Item não encontrado' });
      return;
    }

    const updated = await prisma.checklistItem.update({
      where: { id: req.params.id },
      data: { feito: !item.feito },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar checklist: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/patient/mensagens
router.get('/mensagens', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const mensagens = await prisma.mensagem.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        remetente: true,
        conteudo: true,
        tipo: true,
        pendienteAprovacao: true,
        sentimentoLabel: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: mensagens });
  } catch (err) {
    logger.error(`Erro ao buscar mensagens: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/patient/mensagens
router.post('/mensagens', async (req: Request, res: Response): Promise<void> => {
  try {
    const paciente = await prisma.paciente.findUnique({ where: { userId: req.user!.id } });
    if (!paciente) {
      res.status(404).json({ success: false, error: 'Paciente não encontrado' });
      return;
    }

    const { mensagem } = req.body as { mensagem: string };
    if (!mensagem || mensagem.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Mensagem não pode ser vazia' });
      return;
    }

    // Save patient message
    const patientMsg = await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'paciente',
        conteudo: mensagem,
        tipo: 'paciente',
      },
    });

    // Process through AI service
    const result = await handlePatientMessage({
      mensagem,
      pacienteId: paciente.id,
      clinicId: paciente.clinicId,
    });

    // Save AI/response message
    const aiMsg = await prisma.mensagem.create({
      data: {
        pacienteId: paciente.id,
        clinicId: paciente.clinicId,
        remetente: 'sistema',
        conteudo: result.conteudo,
        tipo: result.tipo,
        pendienteAprovacao: result.pendienteAprovacao,
        sugestaoIA: result.sugestaoIA ?? null,
      },
    });

    // Run sentiment analysis in background
    analyzeSentiment(mensagem)
      .then(async (sentiment) => {
        await prisma.mensagem.update({
          where: { id: patientMsg.id },
          data: {
            sentimentoScore: sentiment.score,
            sentimentoLabel: sentiment.label,
          },
        });

        // Update engagement score
        const scoreIncrement = sentiment.label === 'positivo' ? 2 : 1;
        await prisma.paciente.update({
          where: { id: paciente.id },
          data: { scoreEngajamento: { increment: scoreIncrement } },
        });
      })
      .catch((err) => {
        logger.error(`Erro na análise de sentimento em background: ${err}`);
      });

    res.status(201).json({
      success: true,
      data: {
        patientMessage: patientMsg,
        aiMessage: aiMsg,
        pendienteAprovacao: result.pendienteAprovacao,
      },
    });
  } catch (err) {
    logger.error(`Erro ao enviar mensagem: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
