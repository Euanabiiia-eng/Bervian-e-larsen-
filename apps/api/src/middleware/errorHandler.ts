import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack })
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }

  logger.error('Unknown error', { err })
  res.status(500).json({ error: 'Erro interno do servidor' })
}
