import axios from 'axios'
import { clearAuthSession, getAuthToken, getTenantSelection } from '../auth/token.storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL não foi configurada no ambiente.')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  const tenant = getTenantSelection()

  if (!tenant) {
    return Promise.reject(new Error('Selecione o ambiente antes de continuar.'))
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  config.headers['x-tenant-id'] = tenant

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession()
    }

    return Promise.reject(error)
  },
)
