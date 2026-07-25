export type SubjectActivityItem = {
  id: string
  name: string
  value: number
  finishDate: string
  subjectId: string
  createdAt?: string
  updatedAt?: string
}

export type ActivityFormPayload = {
  name: string
  value: number
  finishDate: string
  subjectId: string
}

export type ActivityStudentGradeItem = {
  studentId: string
  studentName: string
  grade: number | null
}

export type ActivityGradeUpdateItem = {
  studentId: string
  grade: number | null
}
