import type { ReactNode } from 'react'
import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import type { AdminPermissionName } from '../access/admin-access'
import { useAdminAccess } from '../access/use-admin-access'
import { clearAuthSession, getAuthToken, getTenantSelection } from '../services/auth/token.storage'

type GuardProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: GuardProps) {
  const token = getAuthToken()
  const tenant = getTenantSelection()

  if (!token || !tenant) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: GuardProps) {
  const token = getAuthToken()
  const tenant = getTenantSelection()

  if (token && !tenant) {
    clearAuthSession()
  }

  if (token && tenant) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

type PermissionRouteProps = GuardProps & {
  permissions: AdminPermissionName[]
}

export function PermissionRoute({ children, permissions }: PermissionRouteProps) {
  const { hasAnyPermission, isLoading } = useAdminAccess()

  if (isLoading) {
    return <Spin />
  }

  if (!hasAnyPermission(permissions)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export function DefaultAuthorizedRedirect() {
  const { getDefaultAuthorizedPath, isLoading } = useAdminAccess()

  if (isLoading) {
    return <Spin />
  }

  return <Navigate to={getDefaultAuthorizedPath()} replace />
}
