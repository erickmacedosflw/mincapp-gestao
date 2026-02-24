import { apiClient } from '../api/client'
import type { ClassItem } from '../../types/class'

export async function getClasses() {
  const response = await apiClient.get<ClassItem[]>('/class')
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

export async function removeStudentFromClass({ classId, studentId }: RemoveStudentFromClassParams) {
  await apiClient.delete(`/class/student/remove/${classId}`, {
    data: {
      studentId,
    },
  })
}

export async function addStudentToClass({ classId, studentId }: AddStudentToClassParams) {
  await apiClient.post(`/class/student/add/${classId}`, {
    studentIds: [studentId],
  })
}
