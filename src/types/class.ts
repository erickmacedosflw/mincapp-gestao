import type { CampusItem } from './campus'
import type { ClassTypeItem } from './class-type'
import type { StudentItem } from './student'

export type ClassTag = {
  id: string
  description: string
}

export type ClassItem = {
  id: string
  name: string
  initDate: string
  finishDate: string
  subscriptionEndDate?: string
  campusId: string
  campus?: CampusItem | null
  classTypeId?: string | null
  classType?: ClassTypeItem | null
  tags?: ClassTag[]
  students?: StudentItem[]
  createdAt: string
  updatedAt: string
}

export type ClassFilters = {
  page?: number
  perPage?: number
  search?: string
  campusId?: string
  classTypeId?: string
  tagIds?: string[]
  initDate?: string
  finishDate?: string
}

export type ClassesListResponse = {
  page: number
  perPage: number
  total: number
  data: ClassItem[]
}

export type CreateClassPayload = {
  name: string
  initDate: string
  finishDate: string
  subscriptionEndDate?: string
  campusId: string
  classTypeId?: string
  tagIds?: string[]
}

export type UpdateClassPayload = CreateClassPayload

export type DeleteClassResponse = {
  id: string
}

export type ClassTagPayload = {
  description: string
}

export type ClassStudentAttendanceItem = {
  id: string
  name: string
  cpf: string
  noteConceptDevotional: string
}

export type EducationClassResponse = {
  data: {
    students: ClassStudentAttendanceItem[]
  }
}
