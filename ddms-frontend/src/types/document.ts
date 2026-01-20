export type DocumentStatus = 'Upcoming' | 'Overdue' | 'Completed'

export type DocumentItem = {
  id: string
  name: string
  deadlineISO: string // ISO date string (YYYY-MM-DD)
  completed: boolean
  uploadedAtISO: string // ISO date-time string
}


