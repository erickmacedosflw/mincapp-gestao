import { apiClient } from '../api/client'
import type { ClassTypeItem } from '../../types/class-type'

export async function getClassTypes() {
  const response = await apiClient.get<ClassTypeItem[]>('/classType')
  return response.data
}
