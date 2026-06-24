import { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api, setTokens, clearTokens } from '../lib/api'

export interface UserSession {
  id: string
  nome: string
  email: string
  role: string
  clinicId: string
  clinic: {
    nome: string
    corPrimaria: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync('apice_access_token')
      if (!token) { setLoading(false); return }
      const { data } = await api.get('/auth/me')
      setUser(data.data)
    } catch {
      await clearTokens()
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    const { accessToken, refreshToken, user: u } = data.data
    await setTokens(accessToken, refreshToken)
    setUser(u)
    return u
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch {}
    await clearTokens()
    setUser(null)
  }

  return { user, loading, login, logout }
}
