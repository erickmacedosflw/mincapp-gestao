export type ClassItem = {
  id: string
  name: string
  initDate: string
  finishDate: string
  campusId: string
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
