import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import type {
  ClassTypeItem,
  CreateClassTypePayload,
  DeleteClassTypeResponse,
} from '../../types/class-type'

type ApiError = {
  message?: string
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.message ?? fallbackMessage
}

export async function getClassTypes() {
  try {
    const response = await apiClient.get<ClassTypeItem[]>('/classType')
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar os tipos de turma.'))
  }
}

export async function getClassTypeById(classTypeId: string) {
  try {
    const response = await apiClient.get<ClassTypeItem>(`/classType/${classTypeId}`)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar o tipo de turma.'))
  }
}

export async function createClassType(payload: CreateClassTypePayload) {
  try {
    const response = await apiClient.post<ClassTypeItem>('/classType', payload)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível criar o tipo de turma.'))
  }
}

export async function updateClassType(classTypeId: string, payload: CreateClassTypePayload) {
  try {
    const response = await apiClient.put<ClassTypeItem>(`/classType/${classTypeId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível atualizar o tipo de turma.'))
  }
}

export async function deleteClassType(classTypeId: string) {
  try {
    const response = await apiClient.delete<DeleteClassTypeResponse>(`/classType/${classTypeId}`)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível excluir o tipo de turma.'))
  }
}
