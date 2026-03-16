import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import type {
  ClassFilters,
  ClassItem,
  CreateClassPayload,
  DeleteClassResponse,
  EducationClassResponse,
  UpdateClassPayload,
} from '../../types/class'

type ApiError = {
  message?: string
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.message ?? fallbackMessage
}

export async function getClasses(filters?: ClassFilters | string) {
  const normalizedFilters =
    typeof filters === 'string'
      ? {
          campusId: filters,
        }
      : filters

  try {
    const response = await apiClient.get<ClassItem[]>('/class', {
      params: {
        campusId: normalizedFilters?.campusId || undefined,
        classTypeId: normalizedFilters?.classTypeId || undefined,
      },
    })

    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar as turmas.'))
  }
}

export async function getClassById(classId: string) {
  try {
    const response = await apiClient.get<ClassItem>(`/class/${classId}`)
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>

    if (axiosError.response?.status === 404) {
      return null
    }

    throw new Error(resolveApiErrorMessage(error, 'Não foi possível carregar a turma.'))
  }
}

type RemoveStudentFromClassParams = {
  classId: string
  studentId: string
}

type AddStudentToClassParams = {
  classId: string
  studentId: string
}

export async function removeStudentFromClass({
  classId,
  studentId,
}: RemoveStudentFromClassParams) {
  await apiClient.delete(`/class/student/remove/${classId}`, {
    data: {
      studentId,
    },
  })
}

export async function addStudentToClass({
  classId,
  studentId,
}: AddStudentToClassParams) {
  await apiClient.post(`/class/student/add/${classId}`, {
    studentIds: [studentId],
  })
}

export async function createClass(payload: CreateClassPayload) {
  try {
    const response = await apiClient.post<ClassItem>('/class', payload)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível criar a turma.'))
  }
}

export async function updateClass(classId: string, payload: UpdateClassPayload) {
  try {
    const response = await apiClient.put<ClassItem>(`/class/${classId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível atualizar a turma.'))
  }
}

export async function deleteClass(classId: string) {
  try {
    const response = await apiClient.delete<DeleteClassResponse>(`/class/${classId}`)
    return response.data
  } catch (error) {
    throw new Error(resolveApiErrorMessage(error, 'Não foi possível excluir a turma.'))
  }
}

export async function getEducationClassStudents(classId: string) {
  const response = await apiClient.get<EducationClassResponse | { data?: { students?: EducationClassResponse['data']['students'] } } | { students?: EducationClassResponse['data']['students'] }>(
    `/class/${classId}`,
  )

  if (Array.isArray((response.data as EducationClassResponse)?.data?.students)) {
    return (response.data as EducationClassResponse).data.students
  }

  if (Array.isArray((response.data as { students?: EducationClassResponse['data']['students'] })?.students)) {
    return (response.data as { students: EducationClassResponse['data']['students'] }).students
  }

  return []
}
