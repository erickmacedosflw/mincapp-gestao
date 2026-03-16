import { AxiosError } from "axios";
import { apiClient } from "../api/client";
import type {
  SubjectAttendanceDateItem,
  SubjectAttendanceUpdatePayload,
  SubjectDetailsItem,
  SubjectItem,
} from "../../types/subject";

type ApiError = {
  message?: string;
};

type DeleteSubjectResponse = {
  id: string;
};

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? fallbackMessage;
}

type CreateSubjectParams = {
  name: string;
  teacherName: string;
  initDate: string;
  finishDate: string;
  classId: string;
};

type CreateSubjectWeekdayParams = {
  subjectId: string;
  dayOfWeek: number;
};

type CreateSubjectExceptionParams = {
  subjectId: string;
  description: string;
  date: string;
};

type CreateSubjectCallTypeParams = {
  description: string;
  subjectId: string;
  initHour: number;
  initMinute: number;
  finishHour: number;
  finishMinute: number;
};

type UpdateSubjectParams = {
  name: string;
  teacherName: string;
  initDate: string;
  finishDate: string;
  classId: string;
};

type UpdateSubjectCallTypeParams = {
  description: string;
  subjectId: string;
  initHour: number;
  initMinute: number;
  finishHour: number;
  finishMinute: number;
};

export async function getSubjectsByClassId(classId: string) {
  try {
    const response = await apiClient.get<SubjectItem[]>(
      `/subject/class/${classId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível carregar as matérias da turma.",
      ),
    );
  }
}

export async function getSubjectById(subjectId: string) {
  try {
    const response = await apiClient.get<SubjectDetailsItem>(
      `/subject/${subjectId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível carregar a matéria."),
    );
  }
}

export async function createSubject(payload: CreateSubjectParams) {
  try {
    const response = await apiClient.post<SubjectItem>("/subject", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível criar a matéria."),
    );
  }
}

export async function createSubjectWeekday(
  payload: CreateSubjectWeekdayParams,
) {
  await apiClient.post("/weekday/subject", payload);
}

export async function createSubjectException(
  payload: CreateSubjectExceptionParams,
) {
  await apiClient.post("/exception/subject", payload);
}

export async function createSubjectCallType(
  payload: CreateSubjectCallTypeParams,
) {
  await apiClient.post("/calltype/subject", payload);
}

export async function updateSubject(
  subjectId: string,
  payload: UpdateSubjectParams,
) {
  try {
    await apiClient.put(`/subject/${subjectId}`, payload);
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível atualizar a matéria."),
    );
  }
}

export async function deleteSubject(subjectId: string) {
  try {
    const response = await apiClient.delete<DeleteSubjectResponse>(
      `/subject/${subjectId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível excluir a matéria."),
    );
  }
}

export async function updateSubjectCallType(
  callTypeId: string,
  payload: UpdateSubjectCallTypeParams,
) {
  await apiClient.put(`/calltype/subject/${callTypeId}`, payload);
}

export async function deleteSubjectCallType(callTypeId: string) {
  await apiClient.delete(`/calltype/subject/${callTypeId}`);
}

export async function deleteSubjectWeekday(weekdayId: string) {
  await apiClient.delete(`/weekday/subject/${weekdayId}`);
}

export async function deleteSubjectException(exceptionId: string) {
  await apiClient.delete(`/exception/subject/${exceptionId}`);
}

export async function getSubjectAttendanceMarks(subjectId: string) {
  const response = await apiClient.get<
    SubjectAttendanceDateItem[] | { data?: SubjectAttendanceDateItem[] }
  >(`/marks/subject/${subjectId}`);

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  return [];
}

export async function updateSubjectAttendanceMarks(
  payload: SubjectAttendanceUpdatePayload,
) {
  await apiClient.patch("/marks/subject", payload);
}
