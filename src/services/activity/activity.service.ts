import { AxiosError } from "axios"
import { apiClient } from "../api/client"
import type {
  ActivityFormPayload,
  ActivityStudentGradeItem,
  GradeFormPayload,
  SubjectActivityItem,
} from "../../types/activity"
import { assertValidUuid } from "../../utils/uuid"

type ApiError = {
  message?: string
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.message ?? fallbackMessage
}

function validateActivityPayload(payload: ActivityFormPayload) {
  assertValidUuid(payload.subjectId, "Matéria")
}

function validateGradePayload(payload: GradeFormPayload) {
  assertValidUuid(payload.activityId, "Atividade")
  assertValidUuid(payload.studentId, "Aluno")

  if (!Number.isFinite(payload.grade) || payload.grade < 0) {
    throw new Error("A nota deve ser um número maior ou igual a zero.")
  }
}

export async function createActivity(payload: ActivityFormPayload) {
  validateActivityPayload(payload)

  try {
    const response = await apiClient.post<SubjectActivityItem>(
      "/activity",
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível criar a atividade."),
    )
  }
}

export async function updateActivity(
  activityId: string,
  payload: ActivityFormPayload,
) {
  assertValidUuid(activityId, "Atividade")
  validateActivityPayload(payload)

  try {
    const response = await apiClient.put<SubjectActivityItem>(
      `/activity/${activityId}`,
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível editar a atividade."),
    )
  }
}

export async function deleteActivity(activityId: string) {
  assertValidUuid(activityId, "Atividade")

  try {
    await apiClient.delete(`/activity/${activityId}`)
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível excluir a atividade."),
    )
  }
}

export async function createGrade(payload: GradeFormPayload) {
  validateGradePayload(payload)

  try {
    const response = await apiClient.post<ActivityStudentGradeItem>(
      "/grade",
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível lançar a nota."),
    )
  }
}

export async function updateGrade(
  gradeId: string,
  payload: GradeFormPayload,
) {
  assertValidUuid(gradeId, "Nota")
  validateGradePayload(payload)

  try {
    const response = await apiClient.put<ActivityStudentGradeItem>(
      `/grade/${gradeId}`,
      payload,
    )
    return response.data
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível atualizar a nota."),
    )
  }
}

export async function deleteGrade(gradeId: string) {
  assertValidUuid(gradeId, "Nota")

  try {
    await apiClient.delete(`/grade/${gradeId}`)
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível remover a nota."),
    )
  }
}
