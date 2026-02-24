const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export type PeriodStatus = 'not_started' | 'ongoing' | 'closed'

export function parseDayMonthYear(value: string) {
  const [day, month, year] = value.split('/').map(Number)
  return new Date(year, month - 1, day)
}

export function toPeriodLabel(initDate: string, finishDate: string) {
  const start = parseDayMonthYear(initDate)
  const end = parseDayMonthYear(finishDate)

  const startLabel = `${String(start.getDate()).padStart(2, '0')} ${monthLabels[start.getMonth()]} ${start.getFullYear()}`
  const endLabel = `${String(end.getDate()).padStart(2, '0')} ${monthLabels[end.getMonth()]} ${end.getFullYear()}`

  return `${startLabel} até ${endLabel}`
}

export function isClassFinished(finishDate: string) {
  const end = parseDayMonthYear(finishDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return end < today
}

export function isClassActive(initDate: string, finishDate: string) {
  const start = parseDayMonthYear(initDate)
  const end = parseDayMonthYear(finishDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today >= start && today <= end
}

export function getDaysUntilClassEnd(finishDate: string) {
  const end = parseDayMonthYear(finishDate)
  end.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffInMs = end.getTime() - today.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  return diffInDays < 0 ? 0 : diffInDays
}

export function getPeriodStatus(initDate: string, finishDate: string): PeriodStatus {
  const start = parseDayMonthYear(initDate)
  const end = parseDayMonthYear(finishDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (today < start) {
    return 'not_started'
  }

  if (today > end) {
    return 'closed'
  }

  return 'ongoing'
}

export function getRemainingDaysInPeriod(initDate: string, finishDate: string) {
  const status = getPeriodStatus(initDate, finishDate)

  if (status !== 'ongoing') {
    return null
  }

  const end = parseDayMonthYear(finishDate)
  end.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.max(0, Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}
