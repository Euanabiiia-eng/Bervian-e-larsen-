'use client'

import { api, setTokens, clearTokens } from './api'

export interface UserSession {
  id: string
  nome: string
  email: string
  role: string
  clinicId: string
  clinic: {
    id: string
    nome: string
    slug: string
    logoUrl?: string | null
    corPrimaria: string
    corSecundaria: string
  }
}

export async function login(email: string, senha: string): Promise<UserSession> {
  const { data } = await api.post('/auth/login', { email, senha })
  const { accessToken, refreshToken, user } = data.data
  setTokens(accessToken, refreshToken)
  return user
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {}
  clearTokens()
}

export async function getMe(): Promise<UserSession | null> {
  try {
    const { data } = await api.get('/auth/me')
    return data.data
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('apice_access_token')
}
