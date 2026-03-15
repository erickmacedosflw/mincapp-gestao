import axios, { AxiosError } from 'axios'
import type { CampusItem } from '../../types/campus'
import { clearAuthSession, getAuthToken, getTenantSelection } from '../auth/token.storage'
import { getApiBaseUrl } from '../api/client'

type ApiError = {
  message?: string
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>

  return axiosError.response?.data?.message ?? fallbackMessage
}

function getCampusApiBaseUrl() {
  return getApiBaseUrl().replace(/\/education\/?$/, '')
}

const campusApiClient = axios.create({
  baseURL: getCampusApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

campusApiClient.interceptors.request.use((config) => {
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

campusApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession()
    }

    return Promise.reject(error)
  },
)

export async function getCampuses() {
  try {
    const response = await campusApiClient.get<CampusItem[]>('/campus')

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar os campus disponíveis.'))
  }
}
