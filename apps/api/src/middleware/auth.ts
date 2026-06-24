import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  clinicId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      clinic?: import('@prisma/client').Clinic;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de acesso requerido' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('JWT_SECRET não configurado');
    res.status(500).json({ success: false, error: 'Configuração inválida do servidor' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expirado' });
    } else {
      res.status(401).json({ success: false, error: 'Token inválido' });
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Acesso negado: permissão insuficiente' });
      return;
    }

    next();
  };
}
