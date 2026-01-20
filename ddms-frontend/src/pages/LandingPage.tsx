import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, FileUp, Search, Bell } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'

export function LandingPage() {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            Internal tool • Mock data
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Document Deadline Management System
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Automated tracking of deadlines from documents. Upload files, review extracted due dates,
            and stay ahead with alerts and a calendar view.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/upload">
              <Button leftIcon={<FileUp className="h-4 w-4" />}>
                Upload document <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" leftIcon={<CalendarDays className="h-4 w-4" />}>
                View dashboard
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader title="What you can do" subtitle="A simple workflow for teams" />
          <CardBody className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-slate-900 text-sm font-semibold">Upload</div>
              <div className="mt-1 text-xs text-slate-600">PDF/DOC/images with drag-and-drop.</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-slate-900 text-sm font-semibold">Search</div>
              <div className="mt-1 text-xs text-slate-600">Find by name, ID, status, date range.</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-slate-900 text-sm font-semibold">Notify</div>
              <div className="mt-1 text-xs text-slate-600">Upcoming/overdue reminders.</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody className="flex items-start gap-3">
            <Search className="h-5 w-5 text-slate-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Triage quickly</div>
              <div className="mt-1 text-xs text-slate-600">Filters and status labels keep it clear.</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-slate-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Calendar overview</div>
              <div className="mt-1 text-xs text-slate-600">Visualize due dates by month.</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-slate-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Stay on top</div>
              <div className="mt-1 text-xs text-slate-600">Badges and toasts for key changes.</div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}


