export type StudentItem = {
  id: string
  name: string
  email: string
  cpf: string
  age: number
  shirtSize?: string | null
  cellName?: string | null
  leaderName?: string | null
  network?: string | null
  dateBirth?: string | null
  gender?: string | null
  isMember?: boolean | null
  isValidedEmail?: boolean | null
  nameChurch?: string | null
  maritalStatus?: string | null
  profession?: string | null
  schooling?: string | null
  isComplete?: boolean | null
  addressProof?: string | null
  maritalStatusProof?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  phone?: string | null
  avatar?: string | null
  address?: string | null
  numberAddress?: string | null
  complementString?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  classes?: Array<{
    id?: string
    classId?: string
  }>
}

export type StudentAvailableClassItem = {
  id: string
  name: string
  initDate: string
  finishDate: string
  createdAt: string
  updatedAt: string
  subscriptionEndDate: string
  campus_id: string
  classTypeId: string | null
}

export type StudentDetailsResponse = StudentItem & {
  subscriptions: StudentAvailableClassItem[]
  previousSubscriptions: StudentAvailableClassItem[]
  availableForSubscription: StudentAvailableClassItem[]
}

export type StudentListType = 'active_class' | 'ended_classes' | 'without_class'

export type StudentsListResponse = {
  page: number
  total: number
  summary: {
    activeStudents: number
    endedStudents: number
    withoutClassStudents: number
  }
  data: StudentItem[]
}

export type StudentAcademicReportStudent = {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
  dateBirth?: string | null
}

export type StudentAcademicReportSubject = {
  name: string
  teacherName?: string | null
  initDate?: string | null
  finishDate?: string | null
  daysOfWeek?: string[] | null
  totalGrade: number | null
  totalValue?: number | null
  presentCalls?: number | null
  expectedCalls?: number | null
  attendancePercentage: number | null
}

export type StudentAcademicReportClass = {
  name: string
  type?: string | { name?: string | null } | null
  initDate?: string | null
  finishDate?: string | null
  enrollmentDate?: string | null
  daysOfWeek?: string[] | null
  subjects: StudentAcademicReportSubject[]
}

export type StudentAcademicReportResponse = {
  student: StudentAcademicReportStudent
  classes: StudentAcademicReportClass[]
}

export type StudentAcademicReportParams = {
  cpf: string
  classTypeId?: string
  classTypeName?: string
}
