import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('apice_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('apice_refresh_token') : null
      if (!refresh) {
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh })
        const newToken = data.data.accessToken
        localStorage.setItem('apice_access_token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('apice_access_token')
        localStorage.removeItem('apice_refresh_token')
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('apice_access_token', access)
  localStorage.setItem('apice_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('apice_access_token')
  localStorage.removeItem('apice_refresh_token')
}
