import type { CampusItem } from './campus'

export type ClassItem = {
  id: string
  name: string
  initDate: string
  finishDate: string
  subscriptionEndDate?: string
  campusId: string
  campus?: CampusItem | null
  classTypeId: string
  createdAt: string
  updatedAt: string
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
