import type { AdminProfile } from "../../types/auth";
import { isTenantId, type TenantId } from "../../config/tenant";

const TOKEN_KEY = "minc_admin_token";
const ADMIN_KEY = "minc_admin_profile";
const TENANT_KEY = "minc_admin_tenant";

export function saveAuthSession(
  token: string,
  admin: AdminProfile,
  tenant: TenantId,
) {
  const persistedAdmin: AdminProfile = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(persistedAdmin));
  localStorage.setItem(TENANT_KEY, tenant);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveTenantSelection(tenant: TenantId) {
  localStorage.setItem(TENANT_KEY, tenant);
}

export function getTenantSelection(): TenantId | null {
  const tenant = localStorage.getItem(TENANT_KEY);

  return isTenantId(tenant) ? tenant : "inspire";
}

export function getAdminProfile(): AdminProfile | null {
  const raw = localStorage.getItem(ADMIN_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(TENANT_KEY);
}
