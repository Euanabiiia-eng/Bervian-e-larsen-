import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('apice_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = await SecureStore.getItemAsync('apice_refresh_token')
      if (!refresh) return Promise.reject(error)

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh })
        const newToken = data.data.accessToken
        await SecureStore.setItemAsync('apice_access_token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync('apice_access_token')
        await SecureStore.deleteItemAsync('apice_refresh_token')
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('apice_access_token', access)
  await SecureStore.setItemAsync('apice_refresh_token', refresh)
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('apice_access_token')
  await SecureStore.deleteItemAsync('apice_refresh_token')
}
