import type { CampusItem } from './campus'

export type AdminItem = {
  id: string
  name: string
  email: string
  isActive: boolean
  permissions: PermissionTypeItem[]
  campuses: CampusItem[]
  campusIds: string[]
  createdAt: string
  updatedAt: string
}

export type CreateAdminPayload = {
  name: string
  email: string
  password: string
  campusIds?: string[]
}

export type UpdateAdminPayload = {
  name: string
  email: string
  isActive: boolean
}

export type AdminListResponse = {
  page: number
  total: number
  data: AdminItem[]
}

export type PermissionTypeItem = {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export type CreatePermissionTypePayload = {
  name: string
  description: string
}
