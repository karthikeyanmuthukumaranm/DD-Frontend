import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  CalendarCheck2,
  FileUp,
  Home,
  Info,
  Menu,
  X,
  TriangleAlert,
  Clock,
} from 'lucide-react'
import { useDocuments } from '../contexts/DocumentsContext'
import { isOverdue, isUpcoming } from '../utils/date'

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
          'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      <span className="flex items-center gap-3">
        <span className="text-slate-500 group-[.bg-slate-900]:text-white">{icon}</span>
        <span className="font-semibold">{label}</span>
      </span>
      {badge}
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
  const { documents } = useDocuments()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { upcomingCount, overdueCount } = useMemo(() => {
    return {
      upcomingCount: documents.filter(isUpcoming).length,
      overdueCount: documents.filter(isOverdue).length,
    }
  }, [documents])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 tracking-tight">DDMS</div>
            <div className="text-xs text-slate-500">Deadline tracking</div>
          </div>
        </div>
        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-3">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <div className="space-y-1">
          <SideItem
            to="/"
            label="Home"
            icon={<Home className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/dashboard"
            label="Dashboard"
            icon={<CalendarCheck2 className="h-4 w-4" />}
            onNavigate={() => setMobileOpen(false)}
          />
          <SideItem
            to="/upload"
            label="Upload"
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

      <div className="mt-auto border-t border-slate-200 px-4 py-4">
        <div className="text-xs font-semibold text-slate-700">Notifications</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Clock className="h-4 w-4 text-amber-600" /> Upcoming
            </span>
            <CountPill tone="amber" count={upcomingCount} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
              <TriangleAlert className="h-4 w-4 text-red-600" /> Overdue
            </span>
            <CountPill tone="red" count={overdueCount} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-full">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-sm font-bold text-slate-900 tracking-tight">DDMS</div>
          <div className="inline-flex items-center gap-2">
            <CountPill tone="amber" count={upcomingCount} />
            <CountPill tone="red" count={overdueCount} />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="mx-auto max-w-[1400px] md:grid md:grid-cols-[280px_1fr]">
        <aside className="hidden md:block sticky top-0 h-screen border-r border-slate-200 bg-white">
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
          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-white shadow-xl ddms-animate-slide-in-left">
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  )
}


