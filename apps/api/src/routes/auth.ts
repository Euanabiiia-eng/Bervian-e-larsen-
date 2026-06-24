import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { AuthTokenPayload, UserRole } from '@apice/types'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
})

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: { clinic: true },
    })

    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const valid = await bcrypt.compare(senha, user.senhaHash)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcesso: new Date() },
    })

    const payload: AuthTokenPayload = {
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role as UserRole,
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })

    return res.json({
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          telefone: user.telefone,
          clinicId: user.clinicId,
          ativo: user.ativo,
          clinic: {
            id: user.clinic.id,
            nome: user.clinic.nome,
            slug: user.clinic.slug,
            logoUrl: user.clinic.logoUrl,
            corPrimaria: user.clinic.corPrimaria,
            corSecundaria: user.clinic.corSecundaria,
          },
        },
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors })
    }
    throw err
  }
})

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as AuthTokenPayload

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Usuário inativo ou não encontrado' })
    }

    const newPayload: AuthTokenPayload = {
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role as UserRole,
    }

    const accessToken = jwt.sign(newPayload, process.env.JWT_SECRET!, { expiresIn: '15m' })

    return res.json({ data: { accessToken } })
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido ou expirado' })
  }
})

authRouter.post('/logout', authenticate, async (_req: AuthRequest, res: Response) => {
  return res.json({ data: { message: 'Logout realizado com sucesso' } })
})

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { clinic: true },
  })

  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

  return res.json({
    data: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      telefone: user.telefone,
      clinicId: user.clinicId,
      ativo: user.ativo,
      clinic: {
        id: user.clinic.id,
        nome: user.clinic.nome,
        slug: user.clinic.slug,
        logoUrl: user.clinic.logoUrl,
        corPrimaria: user.clinic.corPrimaria,
        corSecundaria: user.clinic.corSecundaria,
      },
    },
  })
})
