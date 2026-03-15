import type { AdminProfile } from "../types/auth";

export const ADMIN_PERMISSIONS = {
  gerenciarTurmas: "gerenciar_turmas",
  gerenciarAlunos: "gerenciar_alunos",
  gerenciarMaterias: "gerenciar_materias",
  gerenciarPresencas: "gerenciar_presencas",
  gerenciarJustificativas: "gerenciar_justificativas",
  visualizarDashboards: "visualizar_dashboards",
  gerenciarAdmins: "gerenciar_admins",
} as const;

export type AdminPermissionName =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

const CLASS_HUB_PERMISSIONS: AdminPermissionName[] = [
  ADMIN_PERMISSIONS.gerenciarTurmas,
  ADMIN_PERMISSIONS.gerenciarAlunos,
  ADMIN_PERMISSIONS.gerenciarMaterias,
  ADMIN_PERMISSIONS.gerenciarPresencas,
  ADMIN_PERMISSIONS.gerenciarJustificativas,
];

function getPermissionNames(admin?: AdminProfile | null) {
  return new Set(
    (admin?.permissions ?? []).map((item) => item.name as AdminPermissionName),
  );
}

export function hasPermission(
  permission: AdminPermissionName,
  admin?: AdminProfile | null,
) {
  return getPermissionNames(admin).has(permission);
}

export function hasAnyPermission(
  permissions: AdminPermissionName[],
  admin?: AdminProfile | null,
) {
  const names = getPermissionNames(admin);
  return permissions.length
    ? permissions.some((permission) => names.has(permission))
    : true;
}

export function canAccessClassHub(
  admin?: AdminProfile | null,
) {
  return hasAnyPermission(CLASS_HUB_PERMISSIONS, admin);
}

export function getDefaultAuthorizedPath(
  admin?: AdminProfile | null,
) {
  if (canAccessClassHub(admin)) {
    return "/class";
  }

  if (hasPermission(ADMIN_PERMISSIONS.gerenciarAlunos, admin)) {
    return "/students";
  }

  if (hasPermission(ADMIN_PERMISSIONS.visualizarDashboards, admin)) {
    return "/dashboard";
  }

  if (hasPermission(ADMIN_PERMISSIONS.gerenciarAdmins, admin)) {
    return "/admins";
  }

  return "/unauthorized";
}
