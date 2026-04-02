import { useMemo, useState } from 'react'
import { CalendarDays, MessageCircle, Mail, Pencil, Trash2, Building2 } from 'lucide-react'
import { endOfDay, parseISO } from 'date-fns'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useInsurance } from '../contexts/InsuranceContext'
import { useToasts } from '../contexts/ToastContext'
import {
  buildPolicyDueMessageWithSignature,
  openWhatsApp,
  type WhatsAppVariant,
} from '../utils/whatsapp'
import { isDueInCalendarMonthISO, isInNextNDaysISO, isOverdueISO } from '../utils/insuranceDates'
import { PAYMENT_MODES, type PaymentMode } from '../types/insurance'
import { isValidEmail, isValidPhoneE164, normalizeEmail, normalizePhoneE164 } from '../utils/validators'

const selectClassName =
  'h-10 w-full min-w-0 rounded-lg bg-[color:var(--card)] px-3 text-sm text-[color:var(--card-fg)] ring-1 ring-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]'

type Preset = 'all' | '15' | 'overdue' | 'custom'

export function PoliciesPage() {
  const {
    policies,
    customers,
    companies,
    addPolicy,
    updatePolicy,
    deletePolicy,
    addCustomer,
  } = useInsurance()
  const { pushToast } = useToasts()

  const [isEditingId, setIsEditingId] = useState<string | null>(null)

  const [createNewCustomer, setCreateNewCustomer] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newDob, setNewDob] = useState('')
  const [newAnniversary, setNewAnniversary] = useState('')

  const [policyNumber, setPolicyNumber] = useState('')
  const [customerId, setCustomerId] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('')
  const [premiumAmount, setPremiumAmount] = useState('')
  const [sumInsured, setSumInsured] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Annual')
  const [paymentTerm, setPaymentTerm] = useState('')
  const [policyTerm, setPolicyTerm] = useState('')
  const [startDateISO, setStartDateISO] = useState<string>('')
  const [dueDateISO, setDueDateISO] = useState<string>('')
  const [notes, setNotes] = useState('')

  const [preset, setPreset] = useState<Preset>('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [dueFrom, setDueFrom] = useState<string>('')
  const [dueTo, setDueTo] = useState<string>('')

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c.fullName])), [customers])
  const companiesById = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies])

  const sorted = useMemo(() => [...policies].sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO)), [policies])

  const filtered = useMemo(() => {
    let list = sorted
    if (monthFilter) {
      const [ys, ms] = monthFilter.split('-')
      const y = Number(ys)
      const m = Number(ms) - 1
      if (Number.isFinite(y) && Number.isFinite(m)) {
        list = list.filter((p) => isDueInCalendarMonthISO(p.dueDateISO, y, m))
      }
    } else if (preset === '15') {
      list = list.filter((p) => isInNextNDaysISO(p.dueDateISO, 15))
    } else if (preset === 'overdue') {
      list = list.filter((p) => isOverdueISO(p.dueDateISO))
    } else if (preset === 'custom' && (dueFrom || dueTo)) {
      const fromD = dueFrom ? parseISO(dueFrom) : null
      const toD = dueTo ? endOfDay(parseISO(dueTo)) : null
      list = list.filter((p) => {
        const d = parseISO(p.dueDateISO)
        if (fromD && d < fromD) return false
        if (toD && d > toD) return false
        return true
      })
    }
    return list
  }, [sorted, monthFilter, preset, dueFrom, dueTo])

  function resetForm() {
    setIsEditingId(null)
    setCreateNewCustomer(false)
    setNewFullName('')
    setNewPhone('')
    setNewEmail('')
    setNewAddress('')
    setNewDob('')
    setNewAnniversary('')
    setPolicyNumber('')
    setCustomerId('')
    setCompanyId('')
    setPremiumAmount('')
    setSumInsured('')
    setPaymentMode('Annual')
    setPaymentTerm('')
    setPolicyTerm('')
    setStartDateISO('')
    setDueDateISO('')
    setNotes('')
  }

  function sendWhatsApp(phone: string, customerName: string, policyNumberVal: string, due: string, variant: WhatsAppVariant) {
    const msg = buildPolicyDueMessageWithSignature({
      customerName,
      policyNumber: policyNumberVal,
      dueDateISO: due,
    })
    openWhatsApp({ phone, message: msg, variant })
  }

  return (
    <div className="ddms-animate-fade-up min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[color:var(--fg)]">Policies</h1>
          <div className="mt-1 text-sm text-[color:var(--muted-fg)]">
            Track premiums, coverage, and renewal due dates.
          </div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--fg)]">
          <CalendarDays className="h-4 w-4" /> {policies.length}
        </div>
      </div>

      <Card>
        <CardHeader
          title={isEditingId ? 'Edit policy' : 'Add policy'}
          subtitle={
            isEditingId
              ? 'Update policy details below.'
              : 'Link to a customer and company, or create a new customer while adding the policy.'
          }
        />
        <CardBody className="space-y-4">
          {!isEditingId ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--fg)]">
              <input
                type="checkbox"
                checked={createNewCustomer}
                onChange={(e) => {
                  setCreateNewCustomer(e.target.checked)
                  if (e.target.checked) setCustomerId('')
                }}
                className="h-4 w-4 rounded border-[color:var(--border)]"
              />
              Create new customer while adding this policy
            </label>
          ) : null}

          {createNewCustomer && !isEditingId ? (
            <div className="rounded-xl bg-[color:var(--muted)] p-4 ring-1 ring-[color:var(--border)]">
              <div className="mb-3 text-xs font-semibold text-[color:var(--muted-fg)]">New customer</div>
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Full name</div>
                  <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Customer name" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Phone (E.164)</div>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+919876543210" inputMode="tel" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Email (optional)</div>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" inputMode="email" />
                </div>
                <div className="min-w-0 md:col-span-2">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Address (required)</div>
                  <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Full address" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Date of birth</div>
                  <Input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Anniversary</div>
                  <Input type="date" value={newAnniversary} onChange={(e) => setNewAnniversary(e.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Policy number</div>
              <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="e.g. POL-12345" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Premium amount</div>
              <Input value={premiumAmount} onChange={(e) => setPremiumAmount(e.target.value)} placeholder="e.g. 15000" />
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Sum insured</div>
              <Input value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} placeholder="Coverage amount" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Payment mode</div>
              <select className={selectClassName} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Payment term</div>
              <Input value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} placeholder="e.g. Same as policy term" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Policy term</div>
              <Input value={policyTerm} onChange={(e) => setPolicyTerm(e.target.value)} placeholder="e.g. 1 year / 10 years" />
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Customer</div>
              <select
                className={selectClassName}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={createNewCustomer && !isEditingId}
              >
                <option value="" disabled>
                  Select customer…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Company</div>
              <select className={selectClassName} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="" disabled>
                  Select company…
                </option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Start date</div>
              <Input type="date" value={startDateISO} onChange={(e) => setStartDateISO(e.target.value)} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Due date</div>
              <Input type="date" value={dueDateISO} onChange={(e) => setDueDateISO(e.target.value)} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Notes</div>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[color:var(--muted-fg)]">
              WhatsApp includes greeting, renewal text, and consultant signature. Use Business on Android to open WhatsApp Business when
              installed.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => resetForm()}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const pn = policyNumber.trim()
                  if (!pn || !companyId || !startDateISO || !dueDateISO) {
                    pushToast({
                      kind: 'error',
                      title: 'Missing fields',
                      message: 'Policy number, company, start date, and due date are required.',
                    })
                    return
                  }

                  let resolvedCustomerId = customerId

                  if (!isEditingId && createNewCustomer) {
                    const addr = newAddress.trim()
                    const name = newFullName.trim()
                    const ph = normalizePhoneE164(newPhone)
                    const em = newEmail.trim()
                    if (!name || !ph || addr.length < 5) {
                      pushToast({
                        kind: 'error',
                        title: 'Customer details',
                        message: 'Name, valid phone, and address (5+ chars) are required for a new customer.',
                      })
                      return
                    }
                    if (!isValidPhoneE164(ph)) {
                      pushToast({ kind: 'error', title: 'Invalid phone', message: 'Use E.164 format, e.g. +919876543210' })
                      return
                    }
                    if (em && !isValidEmail(em)) {
                      pushToast({ kind: 'error', title: 'Invalid email', message: 'Check email or leave empty.' })
                      return
                    }
                    const cust = addCustomer({
                      fullName: name,
                      phoneNumber: ph,
                      email: em ? normalizeEmail(em) : undefined,
                      address: addr,
                      dateOfBirthISO: newDob || undefined,
                      anniversaryDateISO: newAnniversary || undefined,
                    })
                    resolvedCustomerId = cust.id
                  } else if (!customerId) {
                    pushToast({ kind: 'error', title: 'Customer required', message: 'Select a customer or create a new one.' })
                    return
                  }

                  const parsedPremium = Number(premiumAmount)
                  const premium = Number.isFinite(parsedPremium) ? parsedPremium : 0
                  const parsedSum = Number(sumInsured)
                  const sum = Number.isFinite(parsedSum) ? parsedSum : 0

                  if (isEditingId) {
                    updatePolicy(isEditingId, {
                      policyNumber: pn,
                      customerId: resolvedCustomerId,
                      companyId,
                      premiumAmount: premium,
                      sumInsured: sum,
                      paymentMode,
                      paymentTerm: paymentTerm.trim(),
                      policyTerm: policyTerm.trim(),
                      startDateISO,
                      dueDateISO,
                      notes: notes.trim() || undefined,
                    })
                    pushToast({ kind: 'success', title: 'Policy updated', message: 'Saved successfully.' })
                  } else {
                    addPolicy({
                      policyNumber: pn,
                      customerId: resolvedCustomerId,
                      companyId,
                      premiumAmount: premium,
                      sumInsured: sum,
                      paymentMode,
                      paymentTerm: paymentTerm.trim(),
                      policyTerm: policyTerm.trim(),
                      startDateISO,
                      dueDateISO,
                      notes: notes.trim() || undefined,
                    })
                    pushToast({ kind: 'success', title: 'Policy added', message: 'Policy saved successfully.' })
                  }
                  resetForm()
                }}
              >
                {isEditingId ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Policy list" subtitle="Filters: quick presets, due month, or custom date range." />
        <CardBody className="space-y-4">
          <div className="flex min-w-0 flex-wrap gap-2">
            <Button
              size="sm"
              variant={preset === 'all' && !monthFilter ? 'primary' : 'secondary'}
              onClick={() => {
                setPreset('all')
                setMonthFilter('')
                setDueFrom('')
                setDueTo('')
              }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={preset === '15' && !monthFilter ? 'primary' : 'secondary'}
              onClick={() => {
                setPreset('15')
                setMonthFilter('')
                setDueFrom('')
                setDueTo('')
              }}
            >
              Due in 15 days
            </Button>
            <Button
              size="sm"
              variant={preset === 'overdue' && !monthFilter ? 'primary' : 'secondary'}
              onClick={() => {
                setPreset('overdue')
                setMonthFilter('')
                setDueFrom('')
                setDueTo('')
              }}
            >
              Overdue
            </Button>
            <Button
              size="sm"
              variant={preset === 'custom' ? 'primary' : 'secondary'}
              onClick={() => {
                setPreset('custom')
                setMonthFilter('')
              }}
            >
              Custom range
            </Button>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Due in month</div>
              <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => {
                setMonthFilter('')
                setPreset('all')
              }}
            >
              Clear month
            </Button>
          </div>
          {monthFilter ? (
            <div className="text-xs text-[color:var(--muted-fg)]">Showing policies with due date in the selected month.</div>
          ) : null}

          {preset === 'custom' ? (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="w-full min-w-0 sm:w-[140px]">
                <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">From</div>
                <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
              </div>
              <div className="w-full min-w-0 sm:w-[140px]">
                <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">To</div>
                <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
              </div>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="text-sm text-[color:var(--muted-fg)]">No policies match the current filters.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => {
                const customerName = customersById.get(p.customerId) ?? 'Customer'
                const companyName = companiesById.get(p.companyId) ?? 'Company'
                const customer = customers.find((c) => c.id === p.customerId)
                const phone = customer?.phoneNumber ?? ''
                const email = customer?.email ?? ''

                return (
                  <div
                    key={p.id}
                    className="ddms-animate-hover-lift rounded-lg bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]"
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{p.policyNumber}</div>
                          <div className="text-xs text-[color:var(--muted-fg)]">•</div>
                          <div className="max-w-full truncate text-xs text-[color:var(--card-fg)]">{customerName}</div>
                          <div className="text-xs text-[color:var(--muted-fg)]">•</div>
                          <div className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-fg)]">
                            <Building2 className="h-3.5 w-3.5" />
                            {companyName}
                          </div>
                        </div>
                        <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">
                          Premium: {p.premiumAmount.toLocaleString()} • Sum insured: {(p.sumInsured ?? 0).toLocaleString()} •{' '}
                          {p.paymentMode}
                          {p.paymentTerm ? ` • Pay term: ${p.paymentTerm}` : ''}
                          {p.policyTerm ? ` • Policy term: ${p.policyTerm}` : ''}
                        </div>
                        <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">
                          Start: {p.startDateISO} • Due: {p.dueDateISO}
                        </div>
                        {p.notes ? <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">{p.notes}</div> : null}
                      </div>

                      <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-full sm:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<MessageCircle className="h-4 w-4" />}
                          disabled={!phone}
                          onClick={() => {
                            if (!phone) return
                            sendWhatsApp(phone, customerName, p.policyNumber, p.dueDateISO, 'personal')
                          }}
                        >
                          WA Personal
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<MessageCircle className="h-4 w-4" />}
                          disabled={!phone}
                          onClick={() => {
                            if (!phone) return
                            sendWhatsApp(phone, customerName, p.policyNumber, p.dueDateISO, 'business')
                          }}
                        >
                          WA Business
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Mail className="h-4 w-4" />}
                          disabled={!email}
                          onClick={() => {
                            if (!email) return
                            const body = buildPolicyDueMessageWithSignature({
                              customerName,
                              policyNumber: p.policyNumber,
                              dueDateISO: p.dueDateISO,
                            })
                            const subject = `Policy renewal reminder (${p.policyNumber})`
                            const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                            window.open(url, '_blank')
                          }}
                        >
                          Email
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Pencil className="h-4 w-4" />}
                          onClick={() => {
                            setIsEditingId(p.id)
                            setCreateNewCustomer(false)
                            setPolicyNumber(p.policyNumber)
                            setCustomerId(p.customerId)
                            setCompanyId(p.companyId)
                            setPremiumAmount(String(p.premiumAmount))
                            setSumInsured(String(p.sumInsured ?? 0))
                            setPaymentMode(p.paymentMode ?? 'Annual')
                            setPaymentTerm(p.paymentTerm ?? '')
                            setPolicyTerm(p.policyTerm ?? '')
                            setStartDateISO(p.startDateISO)
                            setDueDateISO(p.dueDateISO)
                            setNotes(p.notes ?? '')
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => {
                            const ok = window.confirm(`Delete policy "${p.policyNumber}"?`)
                            if (!ok) return
                            deletePolicy(p.id)
                            pushToast({ kind: 'info', title: 'Policy deleted', message: 'Removed.' })
                            if (isEditingId === p.id) resetForm()
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
