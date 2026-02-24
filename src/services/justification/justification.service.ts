import { apiClient } from '../api/client'
import type { JustificationResponse, JustificationStatusType } from '../../types/justification'

type GetJustificationsParams = {
  classId: string
  status?: JustificationStatusType
}

export async function getJustificationsByClassId({ classId, status }: GetJustificationsParams) {
  const response = await apiClient.get<JustificationResponse>('/justification', {
    params: {
      classId,
      status: status || undefined,
    },
  })

  return response.data
}

export async function acceptJustification(justificationId: string) {
  await apiClient.patch(`/justification/accept/${justificationId}`)
}

export async function rejectJustification(justificationId: string) {
  await apiClient.patch(`/justification/reject/${justificationId}`)
}
