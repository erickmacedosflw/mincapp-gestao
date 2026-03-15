import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import type {
  AdminItem,
  AdminListResponse,
  CreateAdminPayload,
  CreatePermissionTypePayload,
  PermissionTypeItem,
} from '../../types/admin'

type ApiError = {
  message?: string
  code?: number
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>

  return axiosError.response?.data?.message ?? fallbackMessage
}

export async function createAdmin(payload: CreateAdminPayload) {
  try {
    const response = await apiClient.post<AdminItem>('/admin', payload)

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível cadastrar o administrador.'))
  }
}

export async function getAdmins(params?: {
  page?: number
  perPage?: number
  search?: string
}) {
  try {
    const response = await apiClient.get<AdminListResponse>('/admin', {
      params: {
        page: params?.page ?? 1,
        perPage: params?.perPage ?? 10,
        search: params?.search ?? '',
      },
    })

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar os administradores.'))
  }
}

export async function getAdminById(adminId: string) {
  try {
    const response = await apiClient.get<AdminItem>(`/admin/${adminId}`)

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar o administrador logado.'))
  }
}

export async function getPermissionTypes(search?: string) {
  try {
    const response = await apiClient.get<PermissionTypeItem[]>('/admin/permission-type', {
      params: {
        search: search?.trim() || undefined,
      },
    })

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar as permissões.'))
  }
}

export async function createPermissionTypesBulk(payload: { permissions: CreatePermissionTypePayload[] }) {
  try {
    const response = await apiClient.post<PermissionTypeItem[]>('/admin/permission-type/bulk', payload)

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível cadastrar as permissões padrão.'))
  }
}

export async function assignPermissionToAdmin(adminId: string, permissionTypeId: string) {
  try {
    const response = await apiClient.post<AdminItem>(`/admin/${adminId}/permission/${permissionTypeId}`)

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível atribuir a permissão ao administrador.'))
  }
}
