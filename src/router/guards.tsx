import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthToken } from '../services/auth/token.storage'

type GuardProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: GuardProps) {
  const token = getAuthToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: GuardProps) {
  const token = getAuthToken()

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
