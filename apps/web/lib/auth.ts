import Cookies from 'js-cookie'

export interface AuthUser {
  id: string
  email: string
  nome: string
  role: string
  clinicaId: string
  exp: number
  iat: number
}

/**
 * Reads and decodes the JWT payload from the accessToken cookie.
 * Client-side only — just base64-decodes the payload segment.
 */
export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const token = Cookies.get('accessToken')
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Base64url → Base64 → JSON
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as AuthUser
  } catch {
    return null
  }
}

/**
 * Returns true if the user has a valid, non-expired access token.
 */
export function isAuthenticated(): boolean {
  const user = getAuthUser()
  if (!user) return false
  // exp is in seconds
  return user.exp * 1000 > Date.now()
}

/**
 * Clears auth cookies and redirects to /login.
 */
export function logout(): void {
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
