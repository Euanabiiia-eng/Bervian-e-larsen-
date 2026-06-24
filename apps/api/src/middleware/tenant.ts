import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export function requireClinic(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.clinicId) {
    return res.status(403).json({ error: 'Clínica não identificada' })
  }
  next()
}
