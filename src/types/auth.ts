import type { PermissionTypeItem } from './admin'
import type { TenantId } from '../config/tenant'

export type LoginPayload = {
  email: string
  password: string
}

export type AdminProfile = {
  id: string
  name: string
  email: string
  isActive?: boolean
  permissions?: PermissionTypeItem[]
  createdAt?: string
  updatedAt?: string
}

export type AuthResponse = {
  token: string
  admin: AdminProfile
}

export type AuthSession = {
  token: string
  admin: AdminProfile
  tenant: TenantId
}
