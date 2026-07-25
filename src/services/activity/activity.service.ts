import { AxiosError } from "axios"
import { getTenantSelection } from "../auth/token.storage"
import { apiClient } from "../api/client"
import type {
  ActivityFormPayload,
  ActivityGradeUpdateItem,
  ActivityStudentGradeItem,
  SubjectActivityItem,
} from "../../types/activity"

type ApiError = {
  message?: string
}

type ActivityListResponse =
  | SubjectActivityItem[]
  | {
      data?: SubjectActivityItem[]
      activities?: SubjectActivityItem[]
    }

type ActivityGradesResponse =
  | ActivityStudentGradeItem[]
  | {
      data?: ActivityStudentGradeItem[]
      students?: ActivityStudentGradeItem[]
    }

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.message ?? fallbackMessage
}

function educationTenantHeaders() {
  return {
    "x-education-tenant": getTenantSelection(),
  }
}

function normalizeActivityList(
  response: ActivityListResponse,
): SubjectActivityItem[] {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (Array.isArray(response.activities)) {
    return response.activities
  }

  return []
}

function normalizeActivityGrades(
  response: ActivityGradesResponse,
): ActivityStudentGradeItem[] {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (Array.isArray(response.students)) {
    return response.students
  }

  return []
}

export async function getSubjectActivities(subjectId: string) {
  try {
    const response = await apiClient.get<ActivityListResponse>(
      "/admin/activities",
      {
        headers: educationTenantHeaders(),
        params: { subjectId },
      },
    )

    return normalizeActivityList(response.data)
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível carregar as atividades da matéria.",
      ),
    )
  }
}

export async function createActivity(payload: ActivityFormPayload) {
  try {
    const response = await apiClient.post<SubjectActivityItem>(
      "/admin/activities",
      payload,
      { headers: educationTenantHeaders() },
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
  try {
    const response = await apiClient.put<SubjectActivityItem>(
      `/admin/activities/${activityId}`,
      payload,
      { headers: educationTenantHeaders() },
    )
    return response.data
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível editar a atividade."),
    )
  }
}

export async function deleteActivity(activityId: string) {
  try {
    await apiClient.delete(`/admin/activities/${activityId}`, {
      headers: educationTenantHeaders(),
    })
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível excluir a atividade."),
    )
  }
}

export async function getActivityGrades(activityId: string) {
  try {
    const response = await apiClient.get<ActivityGradesResponse>(
      `/admin/activities/${activityId}/grades`,
      { headers: educationTenantHeaders() },
    )

    return normalizeActivityGrades(response.data)
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível carregar as notas da atividade.",
      ),
    )
  }
}

export async function updateActivityGrades(
  activityId: string,
  grades: ActivityGradeUpdateItem[],
) {
  try {
    await apiClient.put(
      `/admin/activities/${activityId}/grades`,
      { grades },
      { headers: educationTenantHeaders() },
    )
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível salvar as notas da atividade.",
      ),
    )
  }
}
