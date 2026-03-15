import { useQuery } from '@tanstack/react-query'
import {
  canAccessClassHub as resolveClassHubAccess,
  getDefaultAuthorizedPath as resolveDefaultAuthorizedPath,
  hasAnyPermission as resolveHasAnyPermission,
  hasPermission as resolveHasPermission,
  type AdminPermissionName,
} from './admin-access'
import { getAdminById } from '../services/admin/admin.service'
import { getAdminProfile } from '../services/auth/token.storage'

export function useAdminAccess() {
  const storedAdmin = getAdminProfile()
  const adminId = storedAdmin?.id ?? ''

  const adminQuery = useQuery({
    queryKey: ['logged-admin', adminId],
    queryFn: () => getAdminById(adminId),
    enabled: Boolean(adminId),
  })

  const admin = adminQuery.data ?? null

  return {
    admin,
    isLoading: adminQuery.isLoading,
    hasPermission: (permission: AdminPermissionName) => resolveHasPermission(permission, admin),
    hasAnyPermission: (permissions: AdminPermissionName[]) => resolveHasAnyPermission(permissions, admin),
    canAccessClassHub: () => resolveClassHubAccess(admin),
    getDefaultAuthorizedPath: () => resolveDefaultAuthorizedPath(admin),
  }
}
