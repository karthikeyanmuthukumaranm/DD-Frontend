import { differenceInCalendarDays, isValid, parseISO } from 'date-fns'

function isoToDateOnly(iso?: string) {
  if (!iso) return null
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

/**
 * Checks if the month/day described by `dateISO` occurs within the next N days
 * (rolling over to next year if needed).
 *
 * `dateISO` is expected to be YYYY-MM-DD.
 */
export function isMonthDayWithinNextNDaysISO(dateISO: string | undefined, nDays: number) {
  const d = isoToDateOnly(dateISO)
  if (!d) return false

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  let candidate = new Date(start.getFullYear(), d.getMonth(), d.getDate())
  // If already passed this year, consider next year.
  if (candidate < start) candidate = new Date(start.getFullYear() + 1, d.getMonth(), d.getDate())

  const diff = differenceInCalendarDays(candidate, start)
  return diff >= 0 && diff <= nDays
}

export function getNextOccurrenceDate(dateISO: string | undefined) {
  const d = isoToDateOnly(dateISO)
  if (!d) return null
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  let candidate = new Date(start.getFullYear(), d.getMonth(), d.getDate())
  if (candidate < start) candidate = new Date(start.getFullYear() + 1, d.getMonth(), d.getDate())
  return candidate
}


