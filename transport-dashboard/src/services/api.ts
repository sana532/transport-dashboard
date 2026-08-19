import axios, { AxiosHeaders } from 'axios'
import { readStoredLocale } from '@/shared/i18n/config'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers)
  const token = localStorage.getItem('auth_token')
  const locale = readStoredLocale()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Lets the API localize push/notification copy (ar vs en).
  headers.set('Accept-Language', locale === 'ar' ? 'ar' : 'en')
  headers.set('X-Locale', locale)

  if (config.data instanceof FormData) {
    headers.delete('Content-Type')
  }

  const method = (config.method ?? 'get').toLowerCase()
  if (method === 'get' || method === 'head' || config.responseType === 'blob') {
    headers.delete('Content-Type')
  }

  config.headers = headers
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_role')
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)
