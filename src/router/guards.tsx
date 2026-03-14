import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
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
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
