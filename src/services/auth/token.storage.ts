import type { AdminProfile } from '../../types/auth'

const TOKEN_KEY = 'minc_admin_token'
const ADMIN_KEY = 'minc_admin_profile'

export function saveAuthSession(token: string, admin: AdminProfile) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAdminProfile(): AdminProfile | null {
  const raw = localStorage.getItem(ADMIN_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminProfile
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}
