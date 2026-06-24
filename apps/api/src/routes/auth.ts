import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { setCache, getCache } from '../lib/redis';
import logger from '../lib/logger';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

function generateAccessToken(payload: {
  id: string;
  email: string;
  role: string;
  clinicId: string;
}): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado');
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

function generateRefreshToken(payload: {
  id: string;
  email: string;
  role: string;
  clinicId: string;
}): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET não configurado');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { clinic: true },
    });

    if (!user || !user.ativo) {
      res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.senhaHash);
    if (!passwordValid) {
      res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      return;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis with 7-day TTL
    await setCache(`refresh:${user.id}:${refreshToken.slice(-20)}`, refreshToken, 7 * 24 * 60 * 60);

    // Update last access
    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcesso: new Date() },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
          clinic: user.clinic,
        },
      },
    });
  } catch (err) {
    logger.error(`Erro no login: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { refreshToken } = parsed.data;
    const secret = process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      res.status(500).json({ success: false, error: 'Configuração inválida' });
      return;
    }

    let payload: { id: string; email: string; role: string; clinicId: string };
    try {
      payload = jwt.verify(refreshToken, secret) as typeof payload;
    } catch {
      res.status(401).json({ success: false, error: 'Refresh token inválido ou expirado' });
      return;
    }

    // Check if token exists in Redis
    const storedToken = await getCache<string>(
      `refresh:${payload.id}:${refreshToken.slice(-20)}`,
    );

    if (!storedToken || storedToken !== refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token revogado' });
      return;
    }

    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    logger.error(`Erro no refresh: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { refreshToken } = parsed.data;
    const secret = process.env.JWT_REFRESH_SECRET;

    if (secret) {
      try {
        const payload = jwt.verify(refreshToken, secret) as { id: string };
        // Delete refresh token from Redis
        const redis = await import('../lib/redis');
        await redis.default.del(`refresh:${payload.id}:${refreshToken.slice(-20)}`);
      } catch {
        // Token already invalid, proceed with logout
      }
    }

    res.json({ success: true, data: { message: 'Logout realizado com sucesso' } });
  } catch (err) {
    logger.error(`Erro no logout: ${err}`);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
