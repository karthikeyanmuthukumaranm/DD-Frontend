import React from 'react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { FileUp, CalendarCheck2, Search, Bell } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">About DDMS</h1>
        <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
          This is a frontend-only prototype of a Document Deadline Management System (DDMS). It uses
          mock data to demonstrate upload UX, dashboard filtering, and a calendar view for deadlines.
        </p>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-900/5">
        <CardHeader
          title="What's Included"
          subtitle="Built with React + Vite + Tailwind CSS"
          right={
            <div className="rounded-xl bg-gradient-to-r from-indigo-100 to-violet-100 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/60">
              Modern Stack
            </div>
          }
        />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-200/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-sm">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Upload System</div>
                <div className="mt-1 text-xs text-slate-600">
                  Drag-and-drop, validation, and loading states
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-200/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 shadow-sm">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Dashboard</div>
                <div className="mt-1 text-xs text-slate-600">
                  Search, filters, table, and calendar view
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-200/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 shadow-sm">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Smart Filters</div>
                <div className="mt-1 text-xs text-slate-600">
                  Filter by status, date range, and search
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50/50 p-4 ring-1 ring-slate-200/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Notifications</div>
                <div className="mt-1 text-xs text-slate-600">
                  Toast notifications and badge counters
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}


