import { apiClient } from '../api/client'
import type { ClassItem, EducationClassResponse } from '../../types/class'

const CLASS_CAMPUS_ID = import.meta.env.VITE_CLASS_CAMPUS_ID?.trim()

if (!CLASS_CAMPUS_ID) {
  throw new Error('VITE_CLASS_CAMPUS_ID não foi configurada no ambiente.')
}

type CreateClassParams = {
  name: string
  initDate: string
  finishDate: string
  subscriptionEndDate: string
}

export async function getClasses(campusId?: string) {
  const response = await apiClient.get<ClassItem[]>('/class', {
    params: campusId ? { campusId } : undefined,
  })
  return response.data
}

export async function getClassById(classId: string) {
  const allClasses = await getClasses()
  return allClasses.find((item) => item.id === classId) ?? null
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

export async function createClass(payload: CreateClassParams) {
  const response = await apiClient.post<ClassItem>('/class', {
    ...payload,
    campusId: CLASS_CAMPUS_ID,
  })

  return response.data
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
