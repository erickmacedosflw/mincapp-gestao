import { apiClient } from '../api/client'
import type { SubjectItem } from '../../types/subject'

export async function getSubjectsByClassId(classId: string) {
  const response = await apiClient.get<SubjectItem[]>(`/subject/class/${classId}`)
  return response.data
}
