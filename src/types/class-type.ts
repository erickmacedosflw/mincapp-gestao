export type ClassTypeItem = {
  id: string
  tenantId?: string
  name: string
  createdAt: string
  updatedAt: string
}

export type CreateClassTypePayload = {
  name: string
}

export type DeleteClassTypeResponse = {
  id: string
}
