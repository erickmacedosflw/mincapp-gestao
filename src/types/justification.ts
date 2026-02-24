export type JustificationStatusType = 'PENDING' | 'APPROVED' | 'DISAPPROVED'

export type JustificationItem = {
  id: string
  date: string
  callTypeId: string
  callTypeDescription: string
  studentId: string
  reason: string
  studentName: string
  studentAvatar: string | null
  subjectName: string
  status: JustificationStatusType
  daysIsOpen: number
  receipts: string[]
}

export type JustificationResponse = {
  data: JustificationItem[]
  enum?: {
    status?: Array<{
      type: JustificationStatusType
    }>
  }
}
