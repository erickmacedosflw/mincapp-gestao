export type SubjectItem = {
  id: string
  name: string
  teacherName: string
  classId: string
  initDate: string
  finishDate: string
  createdAt: string
  updatedAt: string
}

export type SubjectWeekDayItem = {
  dayOfWeek: number
  description: string
  id: string
  subjectId: string
  createdAt: string
  updatedAt: string
}

export type SubjectCallExceptionItem = {
  id: string
  description: string
  subjectId: string
  date: string
  createdAt: string
  updatedAt: string
}

export type SubjectCallTypeItem = {
  description: string
  finishHour: number
  finishMinute: number
  id: string
  initHour: number
  initMinute: number
  subjectId: string
  currentInit: string
  currentFinish: string
  initDisplay: string
  finishDisplay: string
  studentResponses: unknown[]
  createdAt: string
  updatedAt: string
}

export type SubjectDetailsItem = SubjectItem & {
  activities: unknown[]
  callTypes: SubjectCallTypeItem[]
  weekDays: SubjectWeekDayItem[]
  callExceptions: SubjectCallExceptionItem[]
}

export type SubjectAttendanceMarkItem = {
  id: string
  studentId: string
  isReview: boolean
  hasJustify: boolean
  inArea: boolean
  lat: string
  long: string
  createdAt: string
}

export type SubjectAttendanceMarkTypeItem = {
  id: string
  description: string
  marks: SubjectAttendanceMarkItem[]
}

export type SubjectAttendanceDateItem = {
  date: string
  markTypes: SubjectAttendanceMarkTypeItem[]
}

export type SubjectAttendanceUpdatePayload = {
  check: Array<{
    studentId: string
    callTypeId: string
    date: string
  }>
  uncheck: Array<{
    id: string
  }>
}
