import { AxiosError } from "axios";
import { apiClient } from "../api/client";
import type {
  ClassFilters,
  ClassItem,
  ClassesListResponse,
  ClassTag,
  ClassTagPayload,
  CreateClassPayload,
  DeleteClassResponse,
  EducationClassResponse,
  UpdateClassPayload,
} from "../../types/class";

type ApiError = {
  message?: string;
};

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? fallbackMessage;
}

type ClassesApiResponse =
  | ClassItem[]
  | ClassesListResponse
  | {
      data: ClassItem[]
      page?: number
      perPage?: number
      total?: number
    };

function normalizeClassesResponse(
  response: ClassesApiResponse,
  filters?: ClassFilters,
): ClassesListResponse {
  if (Array.isArray(response)) {
    return {
      page: filters?.page ?? 1,
      perPage: filters?.perPage ?? response.length,
      total: response.length,
      data: response.map((item) => ({ ...item, tags: item.tags ?? [] })),
    };
  }

  return {
    page: response.page ?? filters?.page ?? 1,
    perPage: response.perPage ?? filters?.perPage ?? response.data.length,
    total: response.total ?? response.data.length,
    data: response.data.map((item) => ({ ...item, tags: item.tags ?? [] })),
  };
}

export async function getClassesPage(filters?: ClassFilters) {
  try {
    const response = await apiClient.get<ClassesApiResponse>("/class", {
      params: {
        page: filters?.page ?? 1,
        perPage: filters?.perPage ?? 10,
        search: filters?.search || undefined,
        campusId: filters?.campusId || undefined,
        classTypeId: filters?.classTypeId || undefined,
        tagIds: filters?.tagIds?.length ? filters.tagIds : undefined,
        initDate: filters?.initDate || undefined,
        finishDate: filters?.finishDate || undefined,
      },
      paramsSerializer: {
        indexes: null,
      },
    });

    return normalizeClassesResponse(response.data, filters);
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível carregar as turmas."),
    );
  }
}

export async function getClasses(filters?: ClassFilters | string) {
  const normalizedFilters =
    typeof filters === "string"
      ? {
          campusId: filters,
        }
      : filters;

  const perPage = normalizedFilters?.perPage ?? 100;
  let page = 1;
  let total = 0;
  let collected: ClassItem[] = [];

  do {
    const response = await getClassesPage({
      ...normalizedFilters,
      page,
      perPage,
    });

    total = response.total;
    collected = [...collected, ...response.data];
    page += 1;

    if (response.data.length === 0) {
      break;
    }
  } while (collected.length < total);

  return collected;
}

export async function getClassById(classId: string) {
  try {
    const response = await apiClient.get<ClassItem>(`/class/${classId}`);
    return { ...response.data, tags: response.data.tags ?? [] };
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;

    if (axiosError.response?.status === 404) {
      return null;
    }

    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível carregar a turma."),
    );
  }
}

export async function getClassTags() {
  try {
    const response = await apiClient.get<ClassTag[] | { data: ClassTag[] }>(
      "/class/tag",
    );
    return Array.isArray(response.data) ? response.data : response.data.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível carregar as tags."),
    );
  }
}

export async function createClassTag(payload: ClassTagPayload) {
  try {
    const response = await apiClient.post<ClassTag>("/class/tag", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível criar a tag."),
    );
  }
}

export async function updateClassTag(
  tagId: string,
  payload: ClassTagPayload,
) {
  try {
    const response = await apiClient.put<ClassTag>(
      `/class/tag/${tagId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível renomear a tag."),
    );
  }
}

export async function deleteClassTag(tagId: string) {
  try {
    await apiClient.delete(`/class/tag/${tagId}`);
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível excluir a tag."),
    );
  }
}

export async function replaceClassTags(classId: string, tagIds: string[]) {
  try {
    const response = await apiClient.put<ClassItem>(
      `/class/${classId}/tags`,
      { tagIds },
    );
    return { ...response.data, tags: response.data.tags ?? [] };
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível atualizar as tags da turma."),
    );
  }
}

type RemoveStudentFromClassParams = {
  classId: string;
  studentId: string;
};

type AddStudentToClassParams = {
  classId: string;
  studentId: string;
};

type AddStudentsToClassParams = {
  classId: string;
  studentIds: string[];
};

export async function removeStudentFromClass({
  classId,
  studentId,
}: RemoveStudentFromClassParams) {
  await apiClient.delete(`/class/student/remove/${classId}`, {
    data: {
      studentId,
    },
  });
}

export async function addStudentToClass({
  classId,
  studentId,
}: AddStudentToClassParams) {
  await addStudentsToClass({
    classId,
    studentIds: [studentId],
  });
}

export async function addStudentsToClass({
  classId,
  studentIds,
}: AddStudentsToClassParams) {
  await apiClient.post(`/class/student/add/${classId}`, {
    studentIds,
  });
}

export async function createClass(payload: CreateClassPayload) {
  try {
    const response = await apiClient.post<ClassItem>("/class", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível criar a turma."),
    );
  }
}

export async function updateClass(
  classId: string,
  payload: UpdateClassPayload,
) {
  try {
    const response = await apiClient.put<ClassItem>(
      `/class/${classId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível atualizar a turma."),
    );
  }
}

export async function deleteClass(classId: string) {
  try {
    const response = await apiClient.delete<DeleteClassResponse>(
      `/class/${classId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível excluir a turma."),
    );
  }
}

export async function getEducationClassStudents(classId: string) {
  const response = await apiClient.get<
    | EducationClassResponse
    | { data?: { students?: EducationClassResponse["data"]["students"] } }
    | { students?: EducationClassResponse["data"]["students"] }
  >(`/class/${classId}`);

  if (
    Array.isArray((response.data as EducationClassResponse)?.data?.students)
  ) {
    return (response.data as EducationClassResponse).data.students;
  }

  if (
    Array.isArray(
      (
        response.data as {
          students?: EducationClassResponse["data"]["students"];
        }
      )?.students,
    )
  ) {
    return (
      response.data as { students: EducationClassResponse["data"]["students"] }
    ).students;
  }

  return [];
}
