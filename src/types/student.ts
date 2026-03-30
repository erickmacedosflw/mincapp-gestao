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
