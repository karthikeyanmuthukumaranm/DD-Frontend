import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarCheck2, Cake, UserPlus, Users, FileText, ChevronRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { useInsurance } from '../contexts/InsuranceContext'
import { isInNextNDaysISO, isOverdueISO } from '../utils/insuranceDates'
import { getNextOccurrenceDate, isMonthDayWithinNextNDaysISO } from '../utils/reminders'

export function DashboardPage() {
  const { companies, customers, policies, leads } = useInsurance()

  const openLeads = useMemo(() => leads.filter((l) => l.status === 'open'), [leads])
  const leadsFollowUpSoon = useMemo(
    () => openLeads.filter((l) => isInNextNDaysISO(l.followUpDateISO, 15)).sort((a, b) => a.followUpDateISO.localeCompare(b.followUpDateISO)),
    [openLeads],
  )

  const policiesDue15 = useMemo(
    () => [...policies].filter((p) => isInNextNDaysISO(p.dueDateISO, 15)).sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO)),
    [policies],
  )

  const upcomingRenewals30 = useMemo(
    () => [...policies].filter((p) => isInNextNDaysISO(p.dueDateISO, 30)).sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO)),
    [policies],
  )

  const overdueRenewals = useMemo(
    () => [...policies].filter((p) => isOverdueISO(p.dueDateISO)).sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO)),
    [policies],
  )

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c.fullName])), [customers])

  const birthdays = useMemo(
    () =>
      customers
        .filter((c) => isMonthDayWithinNextNDaysISO(c.dateOfBirthISO, 30))
        .map((c) => ({ customerId: c.id, fullName: c.fullName, nextDate: getNextOccurrenceDate(c.dateOfBirthISO) }))
        .filter((x) => x.nextDate)
        .sort((a, b) => (a.nextDate as Date).getTime() - (b.nextDate as Date).getTime()),
    [customers],
  )

  const anniversaries = useMemo(
    () =>
      customers
        .filter((c) => isMonthDayWithinNextNDaysISO(c.anniversaryDateISO, 30))
        .map((c) => ({ customerId: c.id, fullName: c.fullName, nextDate: getNextOccurrenceDate(c.anniversaryDateISO) }))
        .filter((x) => x.nextDate)
        .sort((a, b) => (a.nextDate as Date).getTime() - (b.nextDate as Date).getTime()),
    [customers],
  )

  const statCard = (props: {
    title: string
    count: number
    subtitle: string
    to: string
    icon: ReactNode
    accent: string
  }) => (
    <Link
      to={props.to}
      className="group block rounded-2xl bg-[color:var(--card)] p-5 ring-1 ring-[color:var(--border)] transition hover:ring-2 hover:ring-[color:var(--ring)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${props.accent}`}
        >
          {props.icon}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[color:var(--muted-fg)] opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-[color:var(--fg)]">{props.count}</div>
      <div className="mt-1 text-sm font-semibold text-[color:var(--fg)]">{props.title}</div>
      <div className="mt-1 text-xs text-[color:var(--muted-fg)]">{props.subtitle}</div>
    </Link>
  )

  return (
    <div className="ddms-animate-fade-up min-w-0 max-w-full space-y-8 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--fg)]">Dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-[color:var(--muted-fg)]">
            Customers, policies, and leads in one place — with renewal and follow-up visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[color:var(--muted)] px-3 py-1.5 font-semibold text-[color:var(--fg)] ring-1 ring-[color:var(--border)]">
            Companies: {companies.length}
          </span>
        </div>
      </div>

      <section aria-label="Overview counts">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[color:var(--muted-fg)]">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCard({
            title: 'Customers',
            count: customers.length,
            subtitle: 'Manage profiles & documents',
            to: '/customers',
            icon: <Users className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-sky-500 to-blue-600',
          })}
          {statCard({
            title: 'Policies',
            count: policies.length,
            subtitle: `${policiesDue15.length} due in 15 days • ${overdueRenewals.length} overdue`,
            to: '/policies',
            icon: <FileText className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          })}
          {statCard({
            title: 'Leads',
            count: openLeads.length,
            subtitle: `${leadsFollowUpSoon.length} follow-ups in next 15 days`,
            to: '/leads',
            icon: <UserPlus className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-violet-500 to-purple-600',
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5 ring-1 ring-[color:var(--border)]">
            <CardHeader
              title="Policies — due in 15 days"
              subtitle="Closest renewals first."
              right={<span className="text-xs font-semibold text-[color:var(--muted-fg)]">{policiesDue15.length}</span>}
            />
            <CardBody className="space-y-2">
              {policiesDue15.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{p.policyNumber}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                      {customersById.get(p.customerId) ?? 'Customer'} • Due {p.dueDateISO}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                    15d
                  </span>
                </div>
              ))}
              {policiesDue15.length === 0 ? (
                <div className="text-sm text-[color:var(--muted-fg)]">No policies due in the next 15 days.</div>
              ) : null}
            </CardBody>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5 ring-1 ring-[color:var(--border)]">
            <CardHeader
              title="Policies — next 30 days & overdue"
              subtitle="Broader renewal window plus past-due items."
              right={
                <span className="text-xs font-semibold text-[color:var(--muted-fg)]">
                  {upcomingRenewals30.length} / {overdueRenewals.length}
                </span>
              }
            />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted-fg)]">Upcoming (30d)</div>
                {upcomingRenewals30.slice(0, 5).map((p) => (
                  <div key={p.id} className="rounded-lg bg-[color:var(--muted)] p-2 text-xs ring-1 ring-[color:var(--border)]">
                    <div className="font-semibold text-[color:var(--fg)]">{p.policyNumber}</div>
                    <div className="text-[color:var(--muted-fg)]">{p.dueDateISO}</div>
                  </div>
                ))}
                {upcomingRenewals30.length === 0 ? (
                  <div className="text-xs text-[color:var(--muted-fg)]">None in 30 days.</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-red-600/90">Overdue</div>
                {overdueRenewals.slice(0, 5).map((p) => (
                  <div key={p.id} className="rounded-lg bg-red-500/10 p-2 text-xs ring-1 ring-red-500/20">
                    <div className="font-semibold text-[color:var(--fg)]">{p.policyNumber}</div>
                    <div className="text-[color:var(--muted-fg)]">Was due {p.dueDateISO}</div>
                  </div>
                ))}
                {overdueRenewals.length === 0 ? (
                  <div className="text-xs text-[color:var(--muted-fg)]">No overdue policies.</div>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5 ring-1 ring-[color:var(--border)]">
            <CardHeader
              title="Leads — upcoming follow-ups"
              subtitle="Next 15 days."
              right={<span className="text-xs font-semibold text-[color:var(--muted-fg)]">{leadsFollowUpSoon.length}</span>}
            />
            <CardBody className="space-y-2">
              {leadsFollowUpSoon.slice(0, 8).map((l) => (
                <div
                  key={l.id}
                  className="flex items-start justify-between gap-2 rounded-xl bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{l.name}</div>
                    <div className="mt-0.5 text-xs text-[color:var(--muted-fg)]">{l.interestedProduct}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted-fg)]">Follow-up: {l.followUpDateISO}</div>
                  </div>
                  <UserPlus className="h-4 w-4 shrink-0 text-violet-500" />
                </div>
              ))}
              {leadsFollowUpSoon.length === 0 ? (
                <div className="text-sm text-[color:var(--muted-fg)]">No lead follow-ups in the next 15 days.</div>
              ) : null}
              <Link
                to="/leads"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                Open leads <ChevronRight className="h-3 w-3" />
              </Link>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5 ring-1 ring-[color:var(--border)]">
            <CardHeader title="Birthdays" subtitle="Next 30 days." right={<span className="text-xs text-[color:var(--muted-fg)]">{birthdays.length}</span>} />
            <CardBody className="space-y-2">
              {birthdays.slice(0, 6).map((b) => (
                <div key={b.customerId} className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{b.fullName}</div>
                    <div className="text-xs text-[color:var(--muted-fg)]">{b.nextDate ? format(b.nextDate as Date, 'MMM d') : ''}</div>
                  </div>
                  <Cake className="h-4 w-4 shrink-0 text-amber-500" />
                </div>
              ))}
              {birthdays.length === 0 ? <div className="text-sm text-[color:var(--muted-fg)]">No birthdays soon.</div> : null}
            </CardBody>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5 ring-1 ring-[color:var(--border)]">
            <CardHeader title="Anniversaries" subtitle="Next 30 days." right={<span className="text-xs text-[color:var(--muted-fg)]">{anniversaries.length}</span>} />
            <CardBody className="space-y-2">
              {anniversaries.slice(0, 6).map((a) => (
                <div key={a.customerId} className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{a.fullName}</div>
                    <div className="text-xs text-[color:var(--muted-fg)]">{a.nextDate ? format(a.nextDate as Date, 'MMM d') : ''}</div>
                  </div>
                  <CalendarCheck2 className="h-4 w-4 shrink-0 text-rose-500" />
                </div>
              ))}
              {anniversaries.length === 0 ? <div className="text-sm text-[color:var(--muted-fg)]">No anniversaries soon.</div> : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
