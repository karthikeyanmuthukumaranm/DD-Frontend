import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DocumentItem } from '../types/document'
import { getStatus } from '../utils/date'

export function CalendarView({
  documents,
  onDayClick,
}: {
  documents: DocumentItem[]
  onDayClick?: (isoDate: string) => void
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const byDay = useMemo(() => {
    const map = new Map<string, DocumentItem[]>()
    for (const d of documents) {
      const key = d.deadlineISO
      map.set(key, [...(map.get(key) ?? []), d])
    }
    return map
  }, [documents])

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-100">
        <div>
          <div className="text-sm font-semibold text-slate-900">{format(cursor, 'MMMM yyyy')}</div>
          <div className="mt-1 text-xs text-slate-500">Deadlines by day</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={() => setCursor((d) => subMonths(d, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => (
            <div key={d} className="px-1 py-1 text-[11px] text-slate-500">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd')
            const items = byDay.get(iso) ?? []
            const isToday = isSameDay(day, new Date())
            const inMonth = isSameMonth(day, cursor)

            const dots = items.slice(0, 3).map((doc) => getStatus(doc))
            const extra = items.length - dots.length

            return (
              <button
                key={iso}
                className={clsx(
                  'rounded-lg p-2 text-left ring-1 transition min-h-[70px]',
                  inMonth ? 'bg-white ring-slate-200 hover:bg-slate-50' : 'bg-slate-50 ring-slate-100',
                  isToday && 'ring-2 ring-slate-900/30',
                )}
                onClick={() => onDayClick?.(iso)}
              >
                <div
                  className={clsx(
                    'text-xs font-medium',
                    inMonth ? 'text-slate-900' : 'text-slate-400',
                  )}
                >
                  {format(day, 'd')}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {dots.map((s, idx) => (
                    <span
                      key={`${iso}-${idx}-${s}`}
                      className={clsx(
                        'h-2 w-2 rounded-full',
                        s === 'Completed' && 'bg-green-500',
                        s === 'Upcoming' && 'bg-amber-500',
                        s === 'Overdue' && 'bg-red-500',
                      )}
                      aria-hidden="true"
                    />
                  ))}
                  {extra > 0 ? <span className="text-[11px] text-slate-500">+{extra}</span> : null}
                </div>
                {items.length > 0 ? (
                  <div className="mt-2 text-[11px] text-slate-600">
                    <div className="truncate">{items[0].name}</div>
                    {items.length > 1 ? (
                      <div className="text-[11px] text-slate-500">+{items.length - 1} more</div>
                    ) : null}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


