import { useMemo, useState } from 'react'
import { format, isAfter, isBefore, parseISO } from 'date-fns'
import { CalendarDays, Filter, Search } from 'lucide-react'
import { CalendarView } from '../components/CalendarView'
import { DocumentTable } from '../components/DocumentTable'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useDocuments } from '../contexts/DocumentsContext'
import { useToasts } from '../contexts/ToastContext'
import type { DocumentStatus } from '../types/document'
import { getStatus, isOverdue, isUpcoming } from '../utils/date'

type StatusFilter = 'All' | DocumentStatus

export function DashboardPage() {
  const { documents, markCompleted } = useDocuments()
  const { pushToast } = useToasts()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('All')
  const [from, setFrom] = useState<string>('') // YYYY-MM-DD
  const [to, setTo] = useState<string>('') // YYYY-MM-DD
  const [isLoading] = useState(false) // placeholder to show skeleton pattern

  const upcoming = useMemo(() => documents.filter(isUpcoming), [documents])
  const overdue = useMemo(() => documents.filter(isOverdue), [documents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromDate = from ? parseISO(from) : null
    const toDate = to ? parseISO(to) : null

    return documents.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q)) return false

      const s = getStatus(d)
      if (status !== 'All' && s !== status) return false

      const deadline = parseISO(d.deadlineISO)
      if (fromDate && isBefore(deadline, fromDate)) return false
      if (toDate && isAfter(deadline, toDate)) return false

      return true
    })
  }, [documents, from, search, status, to])

  return (
    <div className="space-y-6 ddms-animate-fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <div className="mt-1 text-sm text-slate-600">
            Review deadlines, filter results, and visualize due dates on the calendar.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">Upcoming</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{upcoming.length}</div>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">Overdue</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{overdue.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Filters"
              subtitle="Search, status, and date range"
              right={
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Filter className="h-3.5 w-3.5" />
                  Refine
                </div>
              }
            />
            <CardBody className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
              <div>
                <select
                  className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                >
                  <option value="All">All statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                />
                <div className="mt-1 text-[11px] text-slate-500">From</div>
              </div>
              <div>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                />
                <div className="mt-1 text-[11px] text-slate-500">To</div>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader
                title="Upcoming deadlines"
                subtitle="Documents due soon"
                right={<span className="text-xs text-slate-500">{upcoming.length}</span>}
              />
              <CardBody className="space-y-3">
                {upcoming.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{d.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Due {format(parseISO(d.deadlineISO), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="text-xs text-amber-700 rounded-full bg-amber-50 ring-1 ring-amber-200 px-2 py-1">
                      Upcoming
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 ? (
                  <div className="text-sm text-slate-600">No upcoming deadlines.</div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Overdue deadlines"
                subtitle="Needs attention"
                right={<span className="text-xs text-slate-500">{overdue.length}</span>}
              />
              <CardBody className="space-y-3">
                {overdue.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{d.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Due {format(parseISO(d.deadlineISO), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="text-xs text-red-700 rounded-full bg-red-50 ring-1 ring-red-200 px-2 py-1">
                      Overdue
                    </div>
                  </div>
                ))}
                {overdue.length === 0 ? (
                  <div className="text-sm text-slate-600">No overdue deadlines.</div>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Documents</div>
              <div className="text-xs text-slate-500">{filtered.length} result(s)</div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <DocumentTable
                documents={filtered}
                onToggleCompleted={(id, completed) => {
                  markCompleted(id, completed)
                  pushToast({
                    kind: completed ? 'success' : 'info',
                    title: completed ? 'Marked as completed' : 'Marked as not completed',
                    message: `Document ${id} updated.`,
                  })
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="h-4 w-4" />
            Calendar view
          </div>
          <CalendarView
            documents={documents}
            onDayClick={(iso) => {
              // Quick filter helper: clicking a day sets the date range to that day.
              setFrom(iso)
              setTo(iso)
              pushToast({ kind: 'info', title: 'Filtered by date', message: `Showing deadlines on ${iso}.` })
            }}
          />
        </div>
      </div>
    </div>
  )
}


