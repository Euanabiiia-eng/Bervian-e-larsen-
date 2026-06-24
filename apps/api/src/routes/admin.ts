import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('clinic_admin', 'super_admin'));

// ─── PROCEDIMENTOS ────────────────────────────────────────────────────────────

// GET /api/admin/procedimentos
router.get('/procedimentos', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const procedimentos = await prisma.procedimento.findMany({
      where: { clinicId },
      include: {
        hospital: { select: { id: true, nome: true } },
        videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        respostasIA: { where: { ativo: true } },
        _count: { select: { pacientes: true } },
      },
      orderBy: { nome: 'asc' },
    });

    res.json({ success: true, data: procedimentos });
  } catch (err) {
    logger.error(`Erro ao listar procedimentos: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/procedimentos
router.post('/procedimentos', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const {
      nome,
      categoria,
      hospitalId,
      duracaoMin,
      anestesia,
      valorBase,
      internacao,
      recuperacaoDias,
      descricao,
      lembrete,
      orientacoesPre,
      orientacoesPos,
      materiais,
      complementares,
    } = req.body as {
      nome: string;
      categoria: string;
      hospitalId?: string;
      duracaoMin?: number;
      anestesia?: string;
      valorBase?: number;
      internacao?: string;
      recuperacaoDias?: number;
      descricao?: string;
      lembrete?: string;
      orientacoesPre?: string;
      orientacoesPos?: string;
      materiais?: string;
      complementares?: string;
    };

    const procedimento = await prisma.procedimento.create({
      data: {
        clinicId,
        nome,
        categoria,
        hospitalId,
        duracaoMin: duracaoMin ?? 120,
        anestesia: anestesia ?? 'Geral',
        valorBase: valorBase ?? 0,
        internacao: internacao ?? 'Day Hospital',
        recuperacaoDias: recuperacaoDias ?? 14,
        descricao,
        lembrete,
        orientacoesPre,
        orientacoesPos,
        materiais,
        complementares,
      },
    });

    res.status(201).json({ success: true, data: procedimento });
  } catch (err) {
    logger.error(`Erro ao criar procedimento: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/procedimentos/:id
router.get('/procedimentos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const proc = await prisma.procedimento.findFirst({
      where: { id: req.params.id, clinicId },
      include: {
        hospital: true,
        videos: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        respostasIA: { where: { ativo: true } },
        _count: { select: { pacientes: true } },
      },
    });

    if (!proc) {
      res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
      return;
    }

    res.json({ success: true, data: proc });
  } catch (err) {
    logger.error(`Erro ao buscar procedimento: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/procedimentos/:id
router.patch('/procedimentos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.procedimento.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
      return;
    }

    const {
      nome,
      categoria,
      hospitalId,
      duracaoMin,
      anestesia,
      valorBase,
      internacao,
      recuperacaoDias,
      descricao,
      lembrete,
      orientacoesPre,
      orientacoesPos,
      materiais,
      complementares,
      ativo,
    } = req.body as {
      nome?: string;
      categoria?: string;
      hospitalId?: string;
      duracaoMin?: number;
      anestesia?: string;
      valorBase?: number;
      internacao?: string;
      recuperacaoDias?: number;
      descricao?: string;
      lembrete?: string;
      orientacoesPre?: string;
      orientacoesPos?: string;
      materiais?: string;
      complementares?: string;
      ativo?: boolean;
    };

    const updated = await prisma.procedimento.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined ? { nome } : {}),
        ...(categoria !== undefined ? { categoria } : {}),
        ...(hospitalId !== undefined ? { hospitalId } : {}),
        ...(duracaoMin !== undefined ? { duracaoMin } : {}),
        ...(anestesia !== undefined ? { anestesia } : {}),
        ...(valorBase !== undefined ? { valorBase } : {}),
        ...(internacao !== undefined ? { internacao } : {}),
        ...(recuperacaoDias !== undefined ? { recuperacaoDias } : {}),
        ...(descricao !== undefined ? { descricao } : {}),
        ...(lembrete !== undefined ? { lembrete } : {}),
        ...(orientacoesPre !== undefined ? { orientacoesPre } : {}),
        ...(orientacoesPos !== undefined ? { orientacoesPos } : {}),
        ...(materiais !== undefined ? { materiais } : {}),
        ...(complementares !== undefined ? { complementares } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
    });

    // Propagate document changes to linked patients
    const orientacoesChanged =
      (orientacoesPos !== undefined && orientacoesPos !== existing.orientacoesPos) ||
      (orientacoesPre !== undefined && orientacoesPre !== existing.orientacoesPre);

    if (orientacoesChanged) {
      const pacientes = await prisma.paciente.findMany({
        where: { procedimentoId: req.params.id },
        select: { id: true },
      });

      for (const paciente of pacientes) {
        if (orientacoesPre !== undefined) {
          await prisma.documento.updateMany({
            where: { pacienteId: paciente.id, tipo: 'orientacoes_pre' },
            data: { conteudo: orientacoesPre },
          });
        }
        if (orientacoesPos !== undefined) {
          await prisma.documento.updateMany({
            where: { pacienteId: paciente.id, tipo: 'orientacoes_pos' },
            data: { conteudo: orientacoesPos },
          });
        }
      }

      logger.info(
        `Orientações atualizadas propagadas para ${pacientes.length} paciente(s) do procedimento ${req.params.id}`,
      );
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar procedimento: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/procedimentos/:id
router.delete('/procedimentos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.procedimento.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
      return;
    }

    await prisma.procedimento.update({
      where: { id: req.params.id },
      data: { ativo: false },
    });

    res.json({ success: true, data: { message: 'Procedimento desativado com sucesso' } });
  } catch (err) {
    logger.error(`Erro ao deletar procedimento: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/procedimentos/:id/videos
router.post('/procedimentos/:id/videos', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const proc = await prisma.procedimento.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!proc) {
      res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
      return;
    }

    const { titulo, url, duracao, descricao, ordem } = req.body as {
      titulo: string;
      url?: string;
      duracao?: string;
      descricao?: string;
      ordem?: number;
    };

    const video = await prisma.procedimentoVideo.create({
      data: {
        procedimentoId: req.params.id,
        titulo,
        url,
        duracao,
        descricao,
        ordem: ordem ?? 0,
      },
    });

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    logger.error(`Erro ao adicionar vídeo: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/procedimentos/:id/videos/:videoId
router.delete(
  '/procedimentos/:id/videos/:videoId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clinicId = req.user!.clinicId;

      const proc = await prisma.procedimento.findFirst({
        where: { id: req.params.id, clinicId },
      });

      if (!proc) {
        res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
        return;
      }

      const video = await prisma.procedimentoVideo.findFirst({
        where: { id: req.params.videoId, procedimentoId: req.params.id },
      });

      if (!video) {
        res.status(404).json({ success: false, error: 'Vídeo não encontrado' });
        return;
      }

      await prisma.procedimentoVideo.delete({ where: { id: req.params.videoId } });

      res.json({ success: true, data: { message: 'Vídeo removido com sucesso' } });
    } catch (err) {
      logger.error(`Erro ao remover vídeo: ${err}`);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  },
);

// ─── HOSPITAIS ────────────────────────────────────────────────────────────────

// GET /api/admin/hospitais
router.get('/hospitais', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const hospitais = await prisma.hospital.findMany({
      where: { clinicId },
      orderBy: { nome: 'asc' },
    });
    res.json({ success: true, data: hospitais });
  } catch (err) {
    logger.error(`Erro ao listar hospitais: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/hospitais
router.post('/hospitais', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { nome, tipo, endereco, cidade, telefone, contato, obs } = req.body as {
      nome: string;
      tipo: string;
      endereco?: string;
      cidade?: string;
      telefone?: string;
      contato?: string;
      obs?: string;
    };

    const hospital = await prisma.hospital.create({
      data: { clinicId, nome, tipo, endereco, cidade, telefone, contato, obs },
    });

    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    logger.error(`Erro ao criar hospital: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/hospitais/:id
router.get('/hospitais/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const hospital = await prisma.hospital.findFirst({
      where: { id: req.params.id, clinicId },
    });

    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital não encontrado' });
      return;
    }

    res.json({ success: true, data: hospital });
  } catch (err) {
    logger.error(`Erro ao buscar hospital: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/hospitais/:id
router.patch('/hospitais/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.hospital.findFirst({ where: { id: req.params.id, clinicId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Hospital não encontrado' });
      return;
    }

    const { nome, tipo, endereco, cidade, telefone, contato, obs, ativo } = req.body as {
      nome?: string;
      tipo?: string;
      endereco?: string;
      cidade?: string;
      telefone?: string;
      contato?: string;
      obs?: string;
      ativo?: boolean;
    };

    const updated = await prisma.hospital.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined ? { nome } : {}),
        ...(tipo !== undefined ? { tipo } : {}),
        ...(endereco !== undefined ? { endereco } : {}),
        ...(cidade !== undefined ? { cidade } : {}),
        ...(telefone !== undefined ? { telefone } : {}),
        ...(contato !== undefined ? { contato } : {}),
        ...(obs !== undefined ? { obs } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar hospital: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/hospitais/:id
router.delete('/hospitais/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.hospital.findFirst({ where: { id: req.params.id, clinicId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Hospital não encontrado' });
      return;
    }

    await prisma.hospital.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ success: true, data: { message: 'Hospital desativado com sucesso' } });
  } catch (err) {
    logger.error(`Erro ao deletar hospital: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── MÉDICOS ──────────────────────────────────────────────────────────────────

// GET /api/admin/medicos
router.get('/medicos', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const medicos = await prisma.medico.findMany({
      where: { clinicId },
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true, ativo: true } },
        _count: { select: { pacientes: true, cirurgias: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: medicos });
  } catch (err) {
    logger.error(`Erro ao listar médicos: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/medicos
router.post('/medicos', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { nome, email, telefone, senha, crm, especialidade, formacao, bio, agenda } =
      req.body as {
        nome: string;
        email: string;
        telefone?: string;
        senha?: string;
        crm: string;
        especialidade: string;
        formacao?: string;
        bio?: string;
        agenda?: string;
      };

    const senhaHash = await bcrypt.hash(senha ?? 'apice2026', 10);

    const user = await prisma.user.create({
      data: { clinicId, nome, email, senhaHash, role: 'doctor', telefone },
    });

    const medico = await prisma.medico.create({
      data: { clinicId, userId: user.id, crm, especialidade, formacao, bio, agenda },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: medico });
  } catch (err) {
    logger.error(`Erro ao criar médico: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/medicos/:id
router.get('/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const medico = await prisma.medico.findFirst({
      where: { id: req.params.id, clinicId },
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        _count: { select: { pacientes: true, cirurgias: true } },
      },
    });

    if (!medico) {
      res.status(404).json({ success: false, error: 'Médico não encontrado' });
      return;
    }

    res.json({ success: true, data: medico });
  } catch (err) {
    logger.error(`Erro ao buscar médico: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/medicos/:id
router.patch('/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.medico.findFirst({ where: { id: req.params.id, clinicId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Médico não encontrado' });
      return;
    }

    const { crm, especialidade, formacao, bio, agenda, ativo } = req.body as {
      crm?: string;
      especialidade?: string;
      formacao?: string;
      bio?: string;
      agenda?: string;
      ativo?: boolean;
    };

    const updated = await prisma.medico.update({
      where: { id: req.params.id },
      data: {
        ...(crm !== undefined ? { crm } : {}),
        ...(especialidade !== undefined ? { especialidade } : {}),
        ...(formacao !== undefined ? { formacao } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(agenda !== undefined ? { agenda } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar médico: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/medicos/:id
router.delete('/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.medico.findFirst({ where: { id: req.params.id, clinicId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Médico não encontrado' });
      return;
    }

    await prisma.medico.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.json({ success: true, data: { message: 'Médico desativado com sucesso' } });
  } catch (err) {
    logger.error(`Erro ao deletar médico: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ─── RESPOSTAS IA ─────────────────────────────────────────────────────────────

// GET /api/admin/respostas-ia?procedimentoId=
router.get('/respostas-ia', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { procedimentoId } = req.query as { procedimentoId?: string };

    const respostas = await prisma.respostaIA.findMany({
      where: {
        procedimento: { clinicId },
        ...(procedimentoId ? { procedimentoId } : {}),
      },
      include: {
        procedimento: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: respostas });
  } catch (err) {
    logger.error(`Erro ao listar respostas IA: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/respostas-ia
router.post('/respostas-ia', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;
    const { procedimentoId, palavrasChave, resposta } = req.body as {
      procedimentoId: string;
      palavrasChave: string;
      resposta: string;
    };

    // Verify procedure belongs to clinic
    const proc = await prisma.procedimento.findFirst({ where: { id: procedimentoId, clinicId } });
    if (!proc) {
      res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
      return;
    }

    const respostaIA = await prisma.respostaIA.create({
      data: { procedimentoId, palavrasChave, resposta },
    });

    res.status(201).json({ success: true, data: respostaIA });
  } catch (err) {
    logger.error(`Erro ao criar resposta IA: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/respostas-ia/:id
router.patch('/respostas-ia/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.respostaIA.findFirst({
      where: { id: req.params.id, procedimento: { clinicId } },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Resposta IA não encontrada' });
      return;
    }

    const { palavrasChave, resposta, ativo } = req.body as {
      palavrasChave?: string;
      resposta?: string;
      ativo?: boolean;
    };

    const updated = await prisma.respostaIA.update({
      where: { id: req.params.id },
      data: {
        ...(palavrasChave !== undefined ? { palavrasChave } : {}),
        ...(resposta !== undefined ? { resposta } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error(`Erro ao atualizar resposta IA: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/respostas-ia/:id
router.delete('/respostas-ia/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    const existing = await prisma.respostaIA.findFirst({
      where: { id: req.params.id, procedimento: { clinicId } },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Resposta IA não encontrada' });
      return;
    }

    await prisma.respostaIA.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Resposta IA removida com sucesso' } });
  } catch (err) {
    logger.error(`Erro ao deletar resposta IA: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
