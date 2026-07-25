export type SubjectActivityItem = {
  id: string
  name: string
  value: number
  dateFinish: string
  subjectId: string
  studentGrades: ActivityStudentGradeItem[]
  createdAt?: string
  updatedAt?: string
}

export type ActivityFormPayload = {
  name: string
  value: number
  dateFinish: string
  subjectId: string
}

export type ActivityStudentGradeItem = {
  id: string
  activityId: string
  studentId: string
  grade: number
  createdAt?: string
  updatedAt?: string
}

export type GradeFormPayload = {
  activityId: string
  studentId: string
  grade: number
}
