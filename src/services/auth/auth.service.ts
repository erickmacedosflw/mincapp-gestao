import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import type { AuthResponse, LoginPayload } from '../../types/auth'
import { saveAuthSession } from './token.storage'

type ApiError = {
  message?: string
}

export async function authenticate(payload: LoginPayload) {
  try {
    const response = await apiClient.post<AuthResponse>('/admin/authenticate', payload)
    const data = response.data

    saveAuthSession(data.token, data.admin)

    return data
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>
    const message =
      axiosError.response?.data?.message ??
      'Não foi possível autenticar. Verifique e-mail e senha.'

    throw new Error(message)
  }
}
