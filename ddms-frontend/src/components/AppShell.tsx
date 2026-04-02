import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  BriefcaseBusiness,
  CalendarCheck2,
  Clock,
  FileUp,
  Home,
  Info,
  Menu,
  Moon,
  Sun,
  X,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { useInsurance } from '../contexts/InsuranceContext'
import { isMonthDayWithinNextNDaysISO } from '../utils/reminders'
import { isInNextNDaysISO, isOverdueISO } from '../utils/insuranceDates'
import { useTheme } from '../contexts/ThemeContext'
import { BrandLogo } from './BrandLogo'

function SideItem({
  to,
  icon,
  label,
  badge,
  onNavigate,
}: {
  to: string
  icon: React.ReactNode
  label: string
  badge?: React.ReactNode
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm no-underline',
          isActive
            ? 'bg-[color:var(--fg)] text-[color:var(--bg)]'
            : 'text-[color:var(--muted-fg)] hover:bg-[color:var(--muted)] hover:text-[color:var(--fg)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <span className={clsx(isActive ? 'text-[color:var(--bg)]' : 'text-[color:var(--muted-fg)]')}>{icon}</span>
            <span className="font-semibold">{label}</span>
          </span>
          {badge}
        </>
      )}
    </NavLink>
  )
}

function CountPill({ tone, count }: { tone: 'amber' | 'red'; count: number }) {
  if (count <= 0) return null
  return (
    <span
      className={clsx(
        'inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold',
        tone === 'amber' && 'bg-amber-100 text-amber-800',
        tone === 'red' && 'bg-red-100 text-red-800',
      )}
    >
      {count}
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { policies, customers, leads } = useInsurance()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { upcomingRenewalsCount, overdueRenewalsCount, birthdaysCount, anniversariesCount, leadFollowUpsSoonCount } =
    useMemo(() => {
      const openLeads = leads.filter((l) => l.status === 'open')
      return {
        upcomingRenewalsCount: policies.filter((p) => isInNextNDaysISO(p.dueDateISO, 30)).length,
        overdueRenewalsCount: policies.filter((p) => isOverdueISO(p.dueDateISO)).length,
        birthdaysCount: customers.filter((c) => isMonthDayWithinNextNDaysISO(c.dateOfBirthISO, 30)).length,
        anniversariesCount: customers.filter((c) =>
          isMonthDayWithinNextNDaysISO(c.anniversaryDateISO, 30),
        ).length,
        leadFollowUpsSoonCount: openLeads.filter((l) => isInNextNDaysISO(l.followUpDateISO, 15)).length,
      }
    }, [policies, customers, leads])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-[color:var(--border)] px-4 py-4">
        <div className="min-w-0 flex-1">
          <BrandLogo className="h-10 w-auto max-w-[200px] object-contain object-left" />
          <div className="mt-2 text-xs font-semibold text-[color:var(--fg)]">Insurance Manager</div>
          <div className="text-[11px] text-[color:var(--muted-fg)]">Client & policy tracking</div>
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--muted-fg)] hover:bg-[color:var(--muted)] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-3">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[color:var(--muted-fg)]">
          Navigation
        </div>
        <div className="space-y-1">
          <SideItem
            to="/"
            label="Dashboard"
            icon={<Home className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/companies"
            label="Companies"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/customers"
            label="Customers"
            icon={<Users className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/policies"
            label="Policies"
            icon={<CalendarCheck2 className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/leads"
            label="Leads"
            icon={<UserPlus className="h-4 w-4" />}
            badge={<CountPill tone="amber" count={leadFollowUpsSoonCount} />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/reports"
            label="Reports"
            icon={<FileUp className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/about"
            label="About"
            icon={<Info className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-[color:var(--border)] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-[color:var(--fg)]">Theme</div>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:var(--fg)] hover:bg-[color:var(--muted)]"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
        <div className="mt-3 text-xs font-semibold text-[color:var(--fg)]">Notifications</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2 ring-1 ring-[color:var(--border)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--fg)]">
              <Clock className="h-4 w-4 text-amber-600" /> Upcoming
            </span>
            <CountPill tone="amber" count={upcomingRenewalsCount} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2 ring-1 ring-[color:var(--border)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--fg)]">
              <UserPlus className="h-4 w-4 text-violet-600" /> Lead follow-ups (15d)
            </span>
            <CountPill tone="amber" count={leadFollowUpsSoonCount} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2 ring-1 ring-[color:var(--border)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--fg)]">
              <CalendarCheck2 className="h-4 w-4 text-[color:var(--muted-fg)]" /> Birthdays
            </span>
            <CountPill tone="amber" count={birthdaysCount} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2 ring-1 ring-[color:var(--border)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--fg)]">
              <CalendarCheck2 className="h-4 w-4 text-[color:var(--muted-fg)]" /> Anniversaries
            </span>
            <CountPill tone="amber" count={anniversariesCount} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2 ring-1 ring-[color:var(--border)]">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--fg)]">
              <TriangleAlert className="h-4 w-4 text-red-600" /> Overdue
            </span>
            <CountPill tone="red" count={overdueRenewalsCount} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-full">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--card)] md:hidden">
        <div className="relative flex h-14 items-center justify-between px-4">
          <button
            className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted-fg)] hover:bg-[color:var(--muted)]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-14">
            <BrandLogo className="h-8 w-auto max-w-[min(140px,40vw)] object-contain" compact />
          </div>
          <div className="relative z-10 inline-flex shrink-0 items-center gap-2">
            <CountPill tone="amber" count={upcomingRenewalsCount} />
            <CountPill tone="red" count={overdueRenewalsCount} />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="mx-auto max-w-[1400px] md:grid md:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-[color:var(--border)] bg-[color:var(--card)] md:block">
          {sidebar}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/30 ddms-animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-[color:var(--card)] shadow-xl ddms-animate-slide-in-left">
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  )
}


