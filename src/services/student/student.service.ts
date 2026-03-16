import { apiClient } from '../api/client'
import type { StudentDetailsResponse, StudentsListResponse, StudentListType } from '../../types/student'

type GetStudentsParams = {
  classId?: string
  page: number
  perPage: number
  search?: string
  type?: StudentListType
}

export async function getStudentsByClassId({ classId, page, perPage, search, type }: GetStudentsParams) {
  const response = await apiClient.get<StudentsListResponse>('/student', {
    params: {
      page,
      perPage,
      classId: classId || undefined,
      search: search || undefined,
      type: type || undefined,
    },
  })

  return response.data
}

export async function getAllStudentsForDashboard() {
  const perPage = 100
  let page = 1
  let total = 0
  let collected: StudentsListResponse['data'] = []

  do {
    const response = await getStudentsByClassId({ page, perPage })
    total = response.total
    collected = [...collected, ...response.data]
    page += 1
  } while (collected.length < total)

  return collected
}

export async function getAllStudentsWithoutPagination() {
  const response = await apiClient.get<StudentsListResponse>('/student', {
    params: {
      page: 1,
      perPage: 100000,
    },
  })

  return response.data.data
}

export async function getStudentById(studentId: string) {
  const response = await apiClient.get<StudentDetailsResponse>('/student/me', {
    params: {
      id: studentId,
    },
  })

  return response.data
}
