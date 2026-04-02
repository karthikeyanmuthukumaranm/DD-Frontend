import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell, CalendarClock, FileUp } from 'lucide-react'
import clsx from 'clsx'
import { useDocuments } from '../contexts/DocumentsContext'
import { isOverdue, isUpcoming } from '../utils/date'

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function Navbar() {
  const { documents } = useDocuments()

  const { upcomingCount, overdueCount } = useMemo(() => {
    const upcomingCount = documents.filter(isUpcoming).length
    const overdueCount = documents.filter(isOverdue).length
    return { upcomingCount, overdueCount }
  }, [documents])

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-slate-900 tracking-tight">Insurance Manager</div>
            <div className="text-xs text-slate-500 font-medium">Client & policy tracking</div>
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/dashboard">Dashboard</NavItem>
          <NavItem to="/upload">
            <FileUp className="h-4 w-4" />
            Upload
          </NavItem>
          <NavItem to="/about">About</NavItem>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white px-4 py-2.5 ring-1 ring-slate-200/60 shadow-sm">
            <div className="relative">
              <Bell className="h-4 w-4 text-slate-600" />
              {(upcomingCount > 0 || overdueCount > 0) && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <div className="text-xs text-slate-700 font-semibold">
              <span className="text-indigo-600">{upcomingCount}</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span className="text-red-600">{overdueCount}</span>
            </div>
          </div>
          <div className="md:hidden">
            <NavLink
              to="/dashboard"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
            >
              Dashboard
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  )
}


