import { isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import type { DocumentItem, DocumentStatus } from '../types/document'

export function todayStart(): Date {
  return startOfDay(new Date())
}

export function getStatus(doc: DocumentItem, now = todayStart()): DocumentStatus {
  if (doc.completed) return 'Completed'
  const d = startOfDay(parseISO(doc.deadlineISO))
  if (isBefore(d, now)) return 'Overdue'
  if (isAfter(d, now) || d.getTime() === now.getTime()) return 'Upcoming'
  return 'Upcoming'
}

export function isUpcoming(doc: DocumentItem): boolean {
  return getStatus(doc) === 'Upcoming'
}

export function isOverdue(doc: DocumentItem): boolean {
  return getStatus(doc) === 'Overdue'
}


