export type AdminItem = {
  id: string
  name: string
  email: string
  isActive: boolean
  permissions: PermissionTypeItem[]
  createdAt: string
  updatedAt: string
}

export type CreateAdminPayload = {
  name: string
  email: string
  password: string
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
