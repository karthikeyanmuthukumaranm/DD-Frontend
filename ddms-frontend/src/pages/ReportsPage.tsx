import { useMemo, useState } from 'react'
import { CalendarDays, FileSpreadsheet, Users, Building2 } from 'lucide-react'
import { parseISO, format, endOfDay } from 'date-fns'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useInsurance } from '../contexts/InsuranceContext'
import { isDueInCalendarMonthISO, isInNextNDaysISO } from '../utils/insuranceDates'

type Tab = 'customer' | 'company' | 'renewals'

type RenewalPreset = 'all' | '15' | 'custom'

export function ReportsPage() {
  const { customers, companies, policies } = useInsurance()

  const [tab, setTab] = useState<Tab>('renewals')
  const [from, setFrom] = useState<string>('') // YYYY-MM-DD
  const [to, setTo] = useState<string>('') // YYYY-MM-DD
  const [renewalMonth, setRenewalMonth] = useState('')
  const [renewalPreset, setRenewalPreset] = useState<RenewalPreset>('all')

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c.fullName])), [customers])
  const companiesById = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies])

  const renewalsFiltered = useMemo(() => {
    const sorted = [...policies].sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
    let list = sorted

    if (renewalMonth) {
      const parts = renewalMonth.split('-')
      const y = Number(parts[0])
      const m = Number(parts[1]) - 1
      if (Number.isFinite(y) && Number.isFinite(m)) {
        list = list.filter((p) => isDueInCalendarMonthISO(p.dueDateISO, y, m))
      }
    } else if (renewalPreset === '15') {
      list = list.filter((p) => isInNextNDaysISO(p.dueDateISO, 15))
    } else if (renewalPreset === 'custom' && (from || to)) {
      const fromD = from ? parseISO(from) : null
      const toD = to ? endOfDay(parseISO(to)) : null
      list = list.filter((p) => {
        const d = parseISO(p.dueDateISO)
        if (fromD && d < fromD) return false
        if (toD && d > toD) return false
        return true
      })
    }

    return list
  }, [from, to, policies, renewalMonth, renewalPreset])

  const nextDuePolicyByCustomer = useMemo(() => {
    const map = new Map<string, { dueDateISO: string; policyNumber: string }>()
    const sorted = [...policies].sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
    for (const p of sorted) {
      if (!map.has(p.customerId)) map.set(p.customerId, { dueDateISO: p.dueDateISO, policyNumber: p.policyNumber })
    }
    return map
  }, [policies])

  const nextDuePolicyByCompany = useMemo(() => {
    const map = new Map<string, { dueDateISO: string; policyNumber: string }>()
    const sorted = [...policies].sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
    for (const p of sorted) {
      if (!map.has(p.companyId)) map.set(p.companyId, { dueDateISO: p.dueDateISO, policyNumber: p.policyNumber })
    }
    return map
  }, [policies])

  return (
    <div className="space-y-6 ddms-animate-fade-up">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <div className="mt-1 text-sm text-slate-600">Filtered views for customers, companies, and renewals.</div>
      </div>

      <Card>
        <CardHeader title="Report type" subtitle="Pick a view and adjust filters (where available)." />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tab === 'customer' ? 'primary' : 'secondary'}
              leftIcon={<Users className="h-4 w-4" />}
              onClick={() => setTab('customer')}
            >
              Customer-wise
            </Button>
            <Button
              variant={tab === 'company' ? 'primary' : 'secondary'}
              leftIcon={<Building2 className="h-4 w-4" />}
              onClick={() => setTab('company')}
            >
              Company-wise
            </Button>
            <Button
              variant={tab === 'renewals' ? 'primary' : 'secondary'}
              leftIcon={<CalendarDays className="h-4 w-4" />}
              onClick={() => setTab('renewals')}
            >
              Renewals
            </Button>
          </div>
        </CardBody>
      </Card>

      {tab === 'customer' ? (
        <Card>
          <CardHeader title="Customer-wise report" subtitle="Policy counts and next due renewal (if any)." />
          <CardBody>
            {customers.length === 0 ? (
              <div className="text-sm text-slate-600">No customers found.</div>
            ) : (
              <div className="space-y-3">
                {customers
                  .slice()
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((c) => {
                    const count = policies.filter((p) => p.customerId === c.id).length
                    const next = nextDuePolicyByCustomer.get(c.id)
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{c.fullName}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            Policies: {count}
                            {next ? ` • Next due: ${next.dueDateISO} (${next.policyNumber})` : ''}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          <FileSpreadsheet className="h-4 w-4 inline-block mr-1" /> {count}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === 'company' ? (
        <Card>
          <CardHeader title="Company-wise report" subtitle="Policy counts and next due renewal (if any)." />
          <CardBody>
            {companies.length === 0 ? (
              <div className="text-sm text-slate-600">No companies found.</div>
            ) : (
              <div className="space-y-3">
                {companies
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((co) => {
                    const count = policies.filter((p) => p.companyId === co.id).length
                    const next = nextDuePolicyByCompany.get(co.id)
                    return (
                      <div key={co.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{co.name}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            Policies: {count}
                            {next ? ` • Next due: ${next.dueDateISO} (${next.policyNumber})` : ''}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-700">{count}</div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === 'renewals' ? (
        <Card>
          <CardHeader
            title="Date-wise renewals"
            subtitle="Due in month, next 15 days, or custom date range (same logic as Policies)."
          />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={renewalPreset === 'all' && !renewalMonth ? 'primary' : 'secondary'}
                onClick={() => {
                  setRenewalPreset('all')
                  setRenewalMonth('')
                  setFrom('')
                  setTo('')
                }}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={renewalPreset === '15' && !renewalMonth ? 'primary' : 'secondary'}
                onClick={() => {
                  setRenewalPreset('15')
                  setRenewalMonth('')
                  setFrom('')
                  setTo('')
                }}
              >
                Due in 15 days
              </Button>
              <Button
                size="sm"
                variant={renewalPreset === 'custom' && !renewalMonth ? 'primary' : 'secondary'}
                onClick={() => {
                  setRenewalPreset('custom')
                  setRenewalMonth('')
                }}
              >
                Custom range
              </Button>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Due in month</div>
                <Input
                  type="month"
                  value={renewalMonth}
                  onChange={(e) => {
                    setRenewalMonth(e.target.value)
                    setRenewalPreset('all')
                    setFrom('')
                    setTo('')
                  }}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => setRenewalMonth('')}
              >
                Clear month
              </Button>
            </div>
            {renewalPreset === 'custom' ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="w-full sm:w-[140px]">
                  <div className="mb-1 text-xs font-semibold text-slate-600">From</div>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="w-full sm:w-[140px]">
                  <div className="mb-1 text-xs font-semibold text-slate-600">To</div>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {tab === 'renewals' ? (
        <Card>
          <CardHeader title="Renewal list" subtitle="Policies matching the filters above." />
          <CardBody>
            {renewalsFiltered.length === 0 ? (
              <div className="text-sm text-slate-600">No renewals match the filter.</div>
            ) : (
              <div className="space-y-3">
                {renewalsFiltered.map((p) => (
                  <div key={p.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{p.policyNumber}</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Customer: {customersById.get(p.customerId) ?? 'Customer'} • Company: {companiesById.get(p.companyId) ?? 'Company'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Due on: {p.dueDateISO} ({format(parseISO(p.dueDateISO), 'MMM d, yyyy')})
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Sum insured: {(p.sumInsured ?? 0).toLocaleString()} • Mode: {p.paymentMode ?? 'Annual'}
                          {(p.paymentTerm || p.policyTerm) &&
                            ` • ${p.paymentTerm ? `Pay: ${p.paymentTerm}` : ''}${p.paymentTerm && p.policyTerm ? ' · ' : ''}${p.policyTerm ? `Term: ${p.policyTerm}` : ''}`}
                        </div>
                        {p.notes ? <div className="mt-1 text-xs text-slate-600 break-words">{p.notes}</div> : null}
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        Premium: {p.premiumAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}

