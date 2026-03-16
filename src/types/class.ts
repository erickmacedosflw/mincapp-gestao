import type { CampusItem } from './campus'
import type { ClassTypeItem } from './class-type'

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
  createdAt: string
  updatedAt: string
}

export type ClassFilters = {
  campusId?: string
  classTypeId?: string
}

export type CreateClassPayload = {
  name: string
  initDate: string
  finishDate: string
  subscriptionEndDate?: string
  campusId: string
  classTypeId?: string
}

export type UpdateClassPayload = CreateClassPayload

export type DeleteClassResponse = {
  id: string
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
