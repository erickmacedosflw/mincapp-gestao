import { AxiosError } from "axios";
import { apiClient } from "../api/client";
import type {
  AdminItem,
  AdminListResponse,
  CreateAdminPayload,
  CreatePermissionTypePayload,
  PermissionTypeItem,
  UpdateAdminPayload,
} from "../../types/admin";

type ApiError = {
  message?: string;
  code?: number;
};

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiError>;

  return axiosError.response?.data?.message ?? fallbackMessage;
}

export async function createAdmin(payload: CreateAdminPayload) {
  try {
    const response = await apiClient.post<AdminItem>("/admin", payload);

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível cadastrar o administrador.",
      ),
    );
  }
}

export async function updateAdmin(
  adminId: string,
  payload: UpdateAdminPayload,
) {
  try {
    const response = await apiClient.put<AdminItem>(
      `/admin/${adminId}`,
      payload,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível atualizar o administrador.",
      ),
    );
  }
}

export async function getAdmins(params?: {
  page?: number;
  perPage?: number;
  search?: string;
}) {
  try {
    const response = await apiClient.get<AdminListResponse>("/admin", {
      params: {
        ...(params?.page ? { page: params.page } : {}),
        ...(params?.perPage ? { perPage: params.perPage } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível carregar os administradores.",
      ),
    );
  }
}

export async function getAdminById(adminId: string) {
  try {
    const response = await apiClient.get<AdminItem>(`/admin/${adminId}`);

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível carregar o administrador.",
      ),
    );
  }
}

export async function getPermissionTypes(search?: string) {
  try {
    const response = await apiClient.get<PermissionTypeItem[]>(
      "/admin/permission-type",
      {
        params: {
          search: search?.trim() || undefined,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(error, "Não foi possível carregar as permissões."),
    );
  }
}

export async function createPermissionTypesBulk(payload: {
  permissions: CreatePermissionTypePayload[];
}) {
  try {
    const response = await apiClient.post<PermissionTypeItem[]>(
      "/admin/permission-type/bulk",
      payload,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível cadastrar as permissões padrão.",
      ),
    );
  }
}

export async function assignPermissionToAdmin(
  adminId: string,
  permissionTypeId: string,
) {
  try {
    const response = await apiClient.post<AdminItem>(
      `/admin/${adminId}/permission/${permissionTypeId}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível atribuir a permissão ao administrador.",
      ),
    );
  }
}

export async function addCampusToAdmin(adminId: string, campusId: string) {
  try {
    const response = await apiClient.post<AdminItem>(
      `/admin/${adminId}/campus/${campusId}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível vincular o campus ao administrador.",
      ),
    );
  }
}

export async function removeCampusFromAdmin(adminId: string, campusId: string) {
  try {
    const response = await apiClient.delete<AdminItem>(
      `/admin/${adminId}/campus/${campusId}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível remover o campus do administrador.",
      ),
    );
  }
}

export async function deleteAdmin(adminId: string) {
  try {
    await apiClient.delete(`/admin/${adminId}`);
  } catch (error) {
    throw new Error(
      resolveApiErrorMessage(
        error,
        "Não foi possível remover o administrador.",
      ),
    );
  }
}
