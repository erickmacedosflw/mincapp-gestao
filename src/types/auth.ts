import type { PermissionTypeItem } from './admin'
import type { TenantId } from '../config/tenant'
import type { CampusItem } from './campus'

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
  campuses?: CampusItem[]
  campusIds?: string[]
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
