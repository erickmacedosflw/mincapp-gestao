export type AdminItem = {
  id: string
  name: string
  email: string
  isActive: boolean
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
