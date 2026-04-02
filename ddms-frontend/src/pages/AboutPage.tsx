import { useRef, useState } from 'react'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { FileUp, CalendarCheck2, Search, Bell } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useInsurance } from '../contexts/InsuranceContext'
import { useToasts } from '../contexts/ToastContext'
import { isNativeApp } from '../storage/platform'
import type { InsuranceDb } from '../types/insurance'

function parseInsuranceBackup(input: unknown): InsuranceDb {
  if (!input || typeof input !== 'object') throw new Error('Invalid backup file.')
  const o = input as Record<string, unknown>
  if (!Array.isArray(o.companies) || !Array.isArray(o.customers) || !Array.isArray(o.policies) || !Array.isArray(o.customerDocuments)) {
    throw new Error('Backup file is missing companies, customers, policies, or documents.')
  }
  return {
    schemaVersion: typeof o.schemaVersion === 'number' ? o.schemaVersion : 1,
    companies: o.companies as InsuranceDb['companies'],
    customers: o.customers as InsuranceDb['customers'],
    policies: o.policies as InsuranceDb['policies'],
    customerDocuments: o.customerDocuments as InsuranceDb['customerDocuments'],
    leads: Array.isArray(o.leads) ? (o.leads as InsuranceDb['leads']) : [],
  }
}

export function AboutPage() {
  const { exportBackup, restoreBackup } = useInsurance()
  const { pushToast } = useToasts()
  const importRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--fg)]">About Insurance Manager</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[color:var(--muted-fg)]">
          A lightweight single-user client management app for storing customer/company/policy details, tracking renewal due dates,
          and sending quick renewal messages via WhatsApp.
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
            <div className="flex items-start gap-3 rounded-xl bg-[color:var(--muted)] p-4 ring-1 ring-[color:var(--border)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-sm dark:from-indigo-950/50 dark:to-indigo-900/30 dark:text-indigo-300">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[color:var(--fg)]">Upload System</div>
                <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                  Store up to 3 customer documents (10MB each, images or PDF)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[color:var(--muted)] p-4 ring-1 ring-[color:var(--border)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 shadow-sm dark:from-violet-950/50 dark:to-violet-900/30 dark:text-violet-300">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[color:var(--fg)]">Dashboard</div>
                <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                  Renewal reminders and quick overview
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[color:var(--muted)] p-4 ring-1 ring-[color:var(--border)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 shadow-sm dark:from-purple-950/50 dark:to-purple-900/30 dark:text-purple-300">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[color:var(--fg)]">Smart Filters</div>
                <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                  Filter by status, date range, and search
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[color:var(--muted)] p-4 ring-1 ring-[color:var(--border)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-sm dark:from-amber-950/40 dark:to-amber-900/20 dark:text-amber-300">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[color:var(--fg)]">Notifications</div>
                <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                  Toast notifications and badge counters
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border-0 shadow-xl shadow-slate-900/5">
        <CardHeader title="Backup & Restore" subtitle="Recommended for lifetime personal use." />
        <CardBody className="space-y-3">
          <div className="text-sm text-[color:var(--muted-fg)]">
            Data is stored locally on the device. To avoid accidental loss (uninstall / clear data), keep backups.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const db = await exportBackup()
                  const json = JSON.stringify(db, null, 2)
                  const fileName = `insurance-backup-${new Date().toISOString().slice(0, 10)}.json`

                  if (isNativeApp()) {
                    const relativePath = `exports/${fileName}`
                    await Filesystem.writeFile({
                      path: relativePath,
                      data: json,
                      directory: Directory.Data,
                      encoding: Encoding.UTF8,
                      recursive: true,
                    })
                    const uriRes = await Filesystem.getUri({
                      path: relativePath,
                      directory: Directory.Data,
                    })
                    pushToast({
                      kind: 'success',
                      title: 'Backup saved',
                      message: `Saved to app storage: ${uriRes.uri}`,
                    })
                  } else {
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = fileName
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                    pushToast({ kind: 'success', title: 'Backup downloaded', message: fileName })
                  }
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Failed to export backup.'
                  pushToast({ kind: 'error', title: 'Backup failed', message: msg })
                } finally {
                  setBusy(false)
                }
              }}
            >
              Export backup
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                importRef.current?.click()
              }}
            >
              Restore backup
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBusy(true)
                try {
                  const text = await file.text()
                  const parsed = JSON.parse(text) as unknown
                  const db = parseInsuranceBackup(parsed)
                  await restoreBackup(db)
                  pushToast({ kind: 'success', title: 'Restore complete', message: 'Data imported successfully.' })
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Failed to restore backup.'
                  pushToast({ kind: 'error', title: 'Restore failed', message: msg })
                } finally {
                  setBusy(false)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
          <div className="text-xs text-[color:var(--muted-fg)]">
            Note: Restoring a backup will overwrite the current data on this device.
          </div>
        </CardBody>
      </Card>
    </div>
  )
}


