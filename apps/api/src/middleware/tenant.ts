import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = req.headers['x-clinic-slug'] as string | undefined;
    const clinicId = req.user?.clinicId;

    let clinic = null;

    if (slug) {
      clinic = await prisma.clinic.findUnique({ where: { slug } });
    } else if (clinicId) {
      clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    }

    if (!clinic) {
      res.status(404).json({ success: false, error: 'Clínica não encontrada' });
      return;
    }

    if (!clinic.ativo) {
      res.status(403).json({ success: false, error: 'Clínica inativa' });
      return;
    }

    req.clinic = clinic;
    next();
  } catch (err) {
    logger.error(`Erro no middleware de tenant: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export default tenantMiddleware;
