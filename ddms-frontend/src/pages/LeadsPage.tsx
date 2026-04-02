import { useMemo, useState } from 'react'
import { UserPlus, Pencil, Trash2, ArrowRightCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useInsurance } from '../contexts/InsuranceContext'
import { useToasts } from '../contexts/ToastContext'
import { isInNextNDaysISO } from '../utils/insuranceDates'
import { isValidEmail, isValidPhoneE164, normalizeEmail, normalizePhoneE164 } from '../utils/validators'

export function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead, convertLeadToCustomer } = useInsurance()
  const { pushToast } = useToasts()

  const [isEditingId, setIsEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [address, setAddress] = useState('')
  const [interestedProduct, setInterestedProduct] = useState('')
  const [followUpDateISO, setFollowUpDateISO] = useState('')
  const [notes, setNotes] = useState('')

  const [convertLeadId, setConvertLeadId] = useState<string | null>(null)
  const [convertAddress, setConvertAddress] = useState('')

  const openLeads = useMemo(() => leads.filter((l) => l.status === 'open'), [leads])
  const sorted = useMemo(() => [...openLeads].sort((a, b) => a.followUpDateISO.localeCompare(b.followUpDateISO)), [openLeads])

  function resetForm() {
    setIsEditingId(null)
    setName('')
    setContactPhone('')
    setContactEmail('')
    setAddress('')
    setInterestedProduct('')
    setFollowUpDateISO('')
    setNotes('')
  }

  return (
    <div className="ddms-animate-fade-up min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[color:var(--fg)]">Leads</h1>
          <div className="mt-1 text-sm text-[color:var(--muted-fg)]">
            Track prospects, follow-ups, and convert qualified leads to customers.
          </div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--fg)]">
          <UserPlus className="h-4 w-4" /> {openLeads.length} open
        </div>
      </div>

      <Card>
        <CardHeader
          title={isEditingId ? 'Edit lead' : 'Add lead'}
          subtitle="Follow-up date is used for reminders. Convert adds the person to Customers with a full address."
        />
        <CardBody className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Lead name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prospect name" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Phone (E.164)</div>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+919876543210" inputMode="tel" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Email (optional)</div>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" inputMode="email" />
            </div>
            <div className="min-w-0 md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Address (optional for lead)</div>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Known address (optional)" />
            </div>
            <div className="min-w-0 md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Interested product</div>
              <Input value={interestedProduct} onChange={(e) => setInterestedProduct(e.target.value)} placeholder="e.g. Term life, Health" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Follow-up date</div>
              <Input type="date" value={followUpDateISO} onChange={(e) => setFollowUpDateISO(e.target.value)} />
            </div>
            <div className="min-w-0 md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Notes</div>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conversation notes" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => resetForm()}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const n = name.trim()
                const ph = normalizePhoneE164(contactPhone)
                const em = contactEmail.trim()
                if (!n || !ph || !followUpDateISO || !interestedProduct.trim()) {
                  pushToast({
                    kind: 'error',
                    title: 'Missing fields',
                    message: 'Name, phone, interested product, and follow-up date are required.',
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
                if (isEditingId) {
                  updateLead(isEditingId, {
                    name: n,
                    contactPhone: ph,
                    contactEmail: em ? normalizeEmail(em) : undefined,
                    address: address.trim() || undefined,
                    interestedProduct: interestedProduct.trim(),
                    followUpDateISO,
                    notes: notes.trim() || undefined,
                  })
                  pushToast({ kind: 'success', title: 'Lead updated', message: 'Saved.' })
                } else {
                  addLead({
                    name: n,
                    contactPhone: ph,
                    contactEmail: em ? normalizeEmail(em) : undefined,
                    address: address.trim() || undefined,
                    interestedProduct: interestedProduct.trim(),
                    followUpDateISO,
                    notes: notes.trim() || undefined,
                  })
                  pushToast({ kind: 'success', title: 'Lead added', message: 'Lead saved.' })
                }
                resetForm()
              }}
            >
              {isEditingId ? 'Save' : 'Add'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Open leads"
          subtitle={`Follow-ups in the next 15 days: ${sorted.filter((l) => isInNextNDaysISO(l.followUpDateISO, 15)).length}`}
        />
        <CardBody>
          {sorted.length === 0 ? (
            <div className="text-sm text-[color:var(--muted-fg)]">No open leads. Add one above.</div>
          ) : (
            <div className="space-y-3">
              {sorted.map((l) => (
                <div
                  key={l.id}
                  className="flex min-w-0 flex-col gap-3 rounded-lg bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{l.name}</div>
                    <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">
                      {l.contactPhone}
                      {l.contactEmail ? ` • ${l.contactEmail}` : ''}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
                      Product: {l.interestedProduct} • Follow-up: {l.followUpDateISO}
                      {isInNextNDaysISO(l.followUpDateISO, 15) ? (
                        <span className="ml-2 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-800 dark:text-amber-200">
                          Soon
                        </span>
                      ) : null}
                    </div>
                    {l.address ? <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">{l.address}</div> : null}
                    {l.notes ? <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">{l.notes}</div> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<ArrowRightCircle className="h-4 w-4" />}
                      onClick={() => {
                        setConvertLeadId(l.id)
                        setConvertAddress(l.address?.trim() ?? '')
                      }}
                    >
                      Convert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => {
                        setIsEditingId(l.id)
                        setName(l.name)
                        setContactPhone(l.contactPhone)
                        setContactEmail(l.contactEmail ?? '')
                        setAddress(l.address ?? '')
                        setInterestedProduct(l.interestedProduct)
                        setFollowUpDateISO(l.followUpDateISO)
                        setNotes(l.notes ?? '')
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        const ok = window.confirm(`Delete lead "${l.name}"?`)
                        if (!ok) return
                        deleteLead(l.id)
                        pushToast({ kind: 'info', title: 'Lead deleted', message: 'Removed.' })
                        if (isEditingId === l.id) resetForm()
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {convertLeadId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close"
            onClick={() => {
              setConvertLeadId(null)
              setConvertAddress('')
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-[color:var(--card)] p-5 shadow-xl ring-1 ring-[color:var(--border)]">
            <div className="text-sm font-semibold text-[color:var(--fg)]">Convert to customer</div>
            <div className="mt-1 text-xs text-[color:var(--muted-fg)]">
              Enter the customer&apos;s full address (at least 5 characters). The lead will be removed from this list after conversion.
            </div>
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Address</div>
              <Input value={convertAddress} onChange={(e) => setConvertAddress(e.target.value)} placeholder="Full postal address" />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setConvertLeadId(null)
                  setConvertAddress('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const cust = convertLeadToCustomer(convertLeadId, convertAddress)
                  if (!cust) {
                    pushToast({
                      kind: 'error',
                      title: 'Address required',
                      message: 'Provide a full address (5+ characters) to create the customer.',
                    })
                    return
                  }
                  pushToast({
                    kind: 'success',
                    title: 'Converted',
                    message: `${cust.fullName} is now in Customers. Add policies from the Policies screen.`,
                  })
                  setConvertLeadId(null)
                  setConvertAddress('')
                }}
              >
                Confirm convert
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
