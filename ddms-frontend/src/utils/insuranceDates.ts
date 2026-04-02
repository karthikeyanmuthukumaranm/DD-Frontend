import { addDays, endOfDay, isAfter, isBefore, isEqual, parseISO, startOfDay } from 'date-fns'

export function isOverdueISO(dateISO: string) {
  const d = endOfDay(parseISO(dateISO))
  return isBefore(d, startOfDay(new Date()))
}

export function isInNextNDaysISO(dateISO: string, days: number) {
  const d = startOfDay(parseISO(dateISO))
  const today = startOfDay(new Date())
  const end = startOfDay(addDays(today, days))
  return (isAfter(d, today) || isEqual(d, today)) && (isBefore(d, end) || isEqual(d, end))
}

/** Due date falls in calendar month (month is 0–11, same as JS Date). */
export function isDueInCalendarMonthISO(dueISO: string, year: number, monthIndex: number) {
  const d = parseISO(dueISO)
  return d.getFullYear() === year && d.getMonth() === monthIndex
}

