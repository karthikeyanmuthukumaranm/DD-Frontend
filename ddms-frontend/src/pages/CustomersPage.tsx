import { useMemo, useState } from 'react'
import { Pencil, Search, Trash2, Phone, CalendarDays, MessageCircle, Mail } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useInsurance } from '../contexts/InsuranceContext'
import { useToasts } from '../contexts/ToastContext'
import type { Customer } from '../types/insurance'
import { format } from 'date-fns'
import { getNextOccurrenceDate } from '../utils/reminders'
import { buildPolicyDueMessageWithSignature, openWhatsApp } from '../utils/whatsapp'
import { isValidEmail, isValidPhoneE164, normalizeEmail, normalizePhoneE164 } from '../utils/validators'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { isNativeApp } from '../storage/platform'

const selectClassName =
  'h-10 w-full min-w-0 rounded-lg bg-[color:var(--card)] px-3 text-sm text-[color:var(--card-fg)] ring-1 ring-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]'

function customerMatches(q: string, c: Customer) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    c.fullName.toLowerCase().includes(s) ||
    c.phoneNumber.toLowerCase().includes(s) ||
    (c.email ? c.email.toLowerCase().includes(s) : false)
  )
}

function formatBytes(bytes: number) {
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

export function CustomersPage() {
  const { customers, policies, customerDocuments, addCustomer, updateCustomer, deleteCustomer } = useInsurance()
  const { pushToast } = useToasts()

  const [search, setSearch] = useState('')
  const [isEditingId, setIsEditingId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirthISO, setDateOfBirthISO] = useState<string>('')
  const [anniversaryDateISO, setAnniversaryDateISO] = useState<string>('')

  const [activeCustomerForDocsId, setActiveCustomerForDocsId] = useState<string | null>(null)

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)).filter((c) => customerMatches(search, c)),
    [customers, search],
  )

  const activeCustomer = useMemo(
    () => (activeCustomerForDocsId ? customers.find((c) => c.id === activeCustomerForDocsId) ?? null : null),
    [activeCustomerForDocsId, customers],
  )

  const docsForActiveCustomer = useMemo(
    () => (activeCustomer ? customerDocuments.filter((d) => d.customerId === activeCustomer.id) : []),
    [activeCustomer, customerDocuments],
  )

  function resetForm() {
    setIsEditingId(null)
    setFullName('')
    setPhoneNumber('')
    setEmail('')
    setAddress('')
    setDateOfBirthISO('')
    setAnniversaryDateISO('')
  }

  return (
    <div className="ddms-animate-fade-up min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[color:var(--fg)]">Customers</h1>
          <div className="mt-1 text-sm text-[color:var(--muted-fg)]">Maintain customer details and manage documents.</div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--fg)]">
          <Phone className="h-4 w-4" /> {customers.length}
        </div>
      </div>

      <Card>
        <CardHeader
          title={isEditingId ? 'Edit customer' : 'Add customer'}
          subtitle="Phone must be in E.164 format (example: +919876543210)."
        />
        <CardBody className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Full Name</div>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Phone Number</div>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +919876543210"
                inputMode="tel"
              />
              <div className="mt-1 text-[11px] text-[color:var(--muted-fg)]">
                Required. Must start with + and country code.
              </div>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Email (optional)</div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                inputMode="email"
                autoComplete="email"
              />
              <div className="mt-1 text-[11px] text-[color:var(--muted-fg)]">
                Used for Email reminders (opens your mail app).
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Address</div>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Customer address" />
              <div className="mt-1 text-[11px] text-[color:var(--muted-fg)]">Required. Minimum 5 characters.</div>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Date of Birth</div>
              <Input type="date" value={dateOfBirthISO} onChange={(e) => setDateOfBirthISO(e.target.value)} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Anniversary Date</div>
              <Input type="date" value={anniversaryDateISO} onChange={(e) => setAnniversaryDateISO(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[color:var(--muted-fg)]">Dates are stored as YYYY-MM-DD.</div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => resetForm()}
                disabled={!isEditingId && !fullName && !phoneNumber && !email && !address && !dateOfBirthISO && !anniversaryDateISO}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const trimmedName = fullName.trim()
                  const trimmedPhone = normalizePhoneE164(phoneNumber)
                  const trimmedEmail = email.trim()
                  const trimmedAddress = address.trim()
                  if (!trimmedName || !trimmedPhone || !trimmedAddress) {
                    pushToast({
                      kind: 'error',
                      title: 'Missing fields',
                      message: 'Name, phone, and address are required.',
                    })
                    return
                  }
                  if (!isValidPhoneE164(trimmedPhone)) {
                    pushToast({
                      kind: 'error',
                      title: 'Invalid phone number',
                      message: 'Use E.164 format like +919876543210 (no spaces).',
                    })
                    return
                  }
                  if (trimmedAddress.length < 5) {
                    pushToast({
                      kind: 'error',
                      title: 'Address too short',
                      message: 'Address must be at least 5 characters.',
                    })
                    return
                  }
                  if (trimmedEmail && !isValidEmail(trimmedEmail)) {
                    pushToast({
                      kind: 'error',
                      title: 'Invalid email',
                      message: 'Enter a valid email like name@example.com (or leave empty).',
                    })
                    return
                  }

                  if (isEditingId) {
                    updateCustomer(isEditingId, {
                      fullName: trimmedName,
                      phoneNumber: trimmedPhone,
                      email: trimmedEmail ? normalizeEmail(trimmedEmail) : undefined,
                      address: trimmedAddress,
                      dateOfBirthISO: dateOfBirthISO || undefined,
                      anniversaryDateISO: anniversaryDateISO || undefined,
                    })
                    pushToast({ kind: 'success', title: 'Customer updated', message: 'Saved successfully.' })
                  } else {
                    addCustomer({
                      fullName: trimmedName,
                      phoneNumber: trimmedPhone,
                      email: trimmedEmail ? normalizeEmail(trimmedEmail) : undefined,
                      address: trimmedAddress,
                      dateOfBirthISO: dateOfBirthISO || undefined,
                      anniversaryDateISO: anniversaryDateISO || undefined,
                    })
                    pushToast({ kind: 'success', title: 'Customer added', message: 'Customer saved successfully.' })
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
        <CardHeader
          title="Customer list"
          subtitle="Search by name or phone number."
          right={
            <div className="w-full min-w-0 sm:w-[min(280px,100%)]">
              <div className="relative min-w-0">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Search className="h-4 w-4 text-[color:var(--muted-fg)]" />
                </div>
                <input
                  className="h-10 w-full min-w-0 rounded-lg bg-[color:var(--card)] px-9 text-sm text-[color:var(--card-fg)] ring-1 ring-[color:var(--border)] placeholder:text-[color:var(--muted-fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  placeholder="Search name or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search customers"
                />
              </div>
            </div>
          }
        />
        <CardBody>
          {sortedCustomers.length === 0 ? (
            <div className="text-sm text-[color:var(--muted-fg)]">No customers match your search.</div>
          ) : (
            <div className="space-y-3">
              {sortedCustomers.map((c) => {
                const nextDob = getNextOccurrenceDate(c.dateOfBirthISO)
                const nextAnn = getNextOccurrenceDate(c.anniversaryDateISO)
                return (
                  <div
                    key={c.id}
                    className="ddms-animate-hover-lift flex min-w-0 flex-col gap-3 rounded-lg bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)] sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{c.fullName}</div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[color:var(--muted-fg)]">
                        <a
                          className="break-all text-[color:var(--fg)] underline underline-offset-2 hover:opacity-90"
                          href={`tel:${c.phoneNumber}`}
                        >
                          {c.phoneNumber}
                        </a>
                        {c.email ? (
                          <a
                            className="max-w-full break-all text-[color:var(--fg)] underline underline-offset-2 hover:opacity-90"
                            href={`mailto:${c.email}`}
                          >
                            {c.email}
                          </a>
                        ) : null}
                        {c.dateOfBirthISO && nextDob ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" /> DOB: {format(nextDob, 'MMM d')}
                          </span>
                        ) : null}
                        {c.anniversaryDateISO && nextAnn ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" /> Ann: {format(nextAnn, 'MMM d')}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 break-words text-xs text-[color:var(--muted-fg)]">{c.address}</div>
                    </div>

                    <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-full sm:justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<MessageCircle className="h-4 w-4" />}
                        onClick={() => {
                          const policiesForCustomer = policies
                            .filter((p) => p.customerId === c.id)
                            .sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
                          const nextPolicy = policiesForCustomer[0] ?? null
                          if (!nextPolicy) {
                            pushToast({ kind: 'error', title: 'No policy found', message: 'Add a policy first.' })
                            return
                          }
                          const msg = buildPolicyDueMessageWithSignature({
                            customerName: c.fullName,
                            policyNumber: nextPolicy.policyNumber,
                            dueDateISO: nextPolicy.dueDateISO,
                          })
                          openWhatsApp({ phone: c.phoneNumber, message: msg, variant: 'personal' })
                        }}
                      >
                        WA Personal
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<MessageCircle className="h-4 w-4" />}
                        onClick={() => {
                          const policiesForCustomer = policies
                            .filter((p) => p.customerId === c.id)
                            .sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
                          const nextPolicy = policiesForCustomer[0] ?? null
                          if (!nextPolicy) {
                            pushToast({ kind: 'error', title: 'No policy found', message: 'Add a policy first.' })
                            return
                          }
                          const msg = buildPolicyDueMessageWithSignature({
                            customerName: c.fullName,
                            policyNumber: nextPolicy.policyNumber,
                            dueDateISO: nextPolicy.dueDateISO,
                          })
                          openWhatsApp({ phone: c.phoneNumber, message: msg, variant: 'business' })
                        }}
                      >
                        WA Business
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Mail className="h-4 w-4" />}
                        disabled={!c.email}
                        onClick={() => {
                          const policiesForCustomer = policies
                            .filter((p) => p.customerId === c.id)
                            .sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO))
                          const nextPolicy = policiesForCustomer[0] ?? null
                          if (!nextPolicy) return
                          const msg = buildPolicyDueMessageWithSignature({
                            customerName: c.fullName,
                            policyNumber: nextPolicy.policyNumber,
                            dueDateISO: nextPolicy.dueDateISO,
                          })
                          const subject = `Policy renewal reminder (${nextPolicy.policyNumber})`
                          const url = `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`
                          window.open(url, '_blank')
                        }}
                      >
                        Email
                      </Button>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Pencil className="h-4 w-4" />}
                          onClick={() => {
                            setIsEditingId(c.id)
                            setFullName(c.fullName)
                            setPhoneNumber(c.phoneNumber)
                            setEmail(c.email ?? '')
                            setAddress(c.address)
                            setDateOfBirthISO(c.dateOfBirthISO ?? '')
                            setAnniversaryDateISO(c.anniversaryDateISO ?? '')
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => {
                            const ok = window.confirm(`Delete "${c.fullName}"? This also deletes their policies and documents.`)
                            if (!ok) return
                            deleteCustomer(c.id)
                            pushToast({ kind: 'info', title: 'Customer deleted', message: 'Removed.' })
                            if (activeCustomerForDocsId === c.id) setActiveCustomerForDocsId(null)
                            if (isEditingId === c.id) resetForm()
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

      <Card>
        <CardHeader title="Customer documents" subtitle="Max 3 documents per customer. File size limit: 2MB per file." />
        <CardBody className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold text-[color:var(--muted-fg)]">Select customer</div>
              <select
                className={selectClassName}
                value={activeCustomerForDocsId ?? ''}
                onChange={(e) => setActiveCustomerForDocsId(e.target.value || null)}
              >
                <option value="" disabled>
                  Choose a customer…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 items-center justify-between rounded-lg bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)]">
              <div className="text-xs font-semibold text-[color:var(--fg)]">Documents</div>
              <div className="text-sm font-bold text-[color:var(--fg)]">{docsForActiveCustomer.length} / 3</div>
            </div>
          </div>

          {!activeCustomer ? (
            <div className="text-sm text-[color:var(--muted-fg)]">Select a customer to upload or manage their documents.</div>
          ) : (
            <DocumentManager
              customerId={activeCustomer.id}
              docs={docsForActiveCustomer}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function DocumentManager({
  customerId,
  docs,
}: {
  customerId: string
  docs: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number; storageRef: string }>
  // Note: we keep props minimal; real storage actions come from context in this nested component.
}) {
  const { addCustomerDocumentMeta, deleteCustomerDocument } = useInsurance()
  const { pushToast } = useToasts()

  const MAX_DOCS = 3
  const MAX_BYTES = 10 * 1024 * 1024

  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)

  const [selectedInputKey, setSelectedInputKey] = useState(0)

  async function readFileAsDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Failed to read file.'))
      reader.readAsDataURL(file)
    })
  }

  async function persistFileAndGetRef(file: File): Promise<string> {
    // Web fallback: store as data URL (not ideal for big data, but ok for dev).
    if (!isNativeApp()) return await readFileAsDataUrl(file)

    const dataUrl = await readFileAsDataUrl(file)
    const comma = dataUrl.indexOf(',')
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
    const safeName = file.name.replace(/[^\w.\-]/g, '_')
    const path = `insurance-docs/${customerId}/${Date.now()}-${safeName}`
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    })
    const uriRes = await Filesystem.getUri({ path, directory: Directory.Data })
    return uriRes.uri
  }

  function toDisplaySrc(storageRef: string) {
    return isNativeApp() ? Capacitor.convertFileSrc(storageRef) : storageRef
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="rounded-lg bg-[color:var(--card)] p-3 ring-1 ring-[color:var(--border)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-[color:var(--muted-fg)]">
            Upload up to 3 files (images or PDF). Each file must be 10MB or less. You can select multiple files at once.
          </div>
          <div className="shrink-0 text-xs font-semibold text-[color:var(--fg)]">
            {docs.length}/{MAX_DOCS} used
          </div>
        </div>
        <div className="mt-3 min-w-0">
          <input
            key={selectedInputKey}
            type="file"
            accept="image/*,application/pdf,.pdf"
            multiple
            disabled={docs.length >= MAX_DOCS || isReading}
            className="w-full min-w-0 max-w-full text-sm text-[color:var(--card-fg)] file:mr-3 file:rounded-md file:border-0 file:bg-[color:var(--muted)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--fg)]"
            onChange={async (e) => {
              const list = e.target.files
              if (!list?.length) return
              setError(null)
              setIsReading(true)
              try {
                let added = 0
                let remaining = MAX_DOCS - docs.length
                for (let i = 0; i < list.length; i++) {
                  const file = list[i]
                  if (remaining <= 0) {
                    const msg = 'You can store up to 3 documents for this customer.'
                    setError(msg)
                    pushToast({ kind: 'error', title: 'Max documents reached', message: msg })
                    break
                  }
                  if (file.size > MAX_BYTES) {
                    const msg = `"${file.name}" is too large. Max size is 10MB per file.`
                    setError(msg)
                    pushToast({ kind: 'error', title: 'Upload failed', message: msg })
                    continue
                  }
                  const storageRef = await persistFileAndGetRef(file)
                  addCustomerDocumentMeta({
                    customerId,
                    fileName: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    sizeBytes: file.size,
                    storageRef,
                  })
                  added += 1
                  remaining -= 1
                }
                if (added > 0) {
                  pushToast({
                    kind: 'success',
                    title: added === 1 ? 'Document saved' : 'Documents saved',
                    message: `Stored ${added} file(s) locally for this customer.`,
                  })
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to read file.'
                setError(msg)
                pushToast({ kind: 'error', title: 'Upload failed', message: msg })
              } finally {
                setIsReading(false)
                setSelectedInputKey((x) => x + 1)
              }
            }}
          />
        </div>
        {error ? <div className="mt-2 text-xs text-red-500">{error}</div> : null}
      </div>

      {docs.length === 0 ? (
        <div className="text-sm text-[color:var(--muted-fg)]">No documents uploaded yet.</div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex min-w-0 flex-col gap-3 rounded-lg bg-[color:var(--muted)] p-3 ring-1 ring-[color:var(--border)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-sm font-semibold text-[color:var(--fg)]">{d.fileName}</div>
                <div className="mt-1 break-all text-xs text-[color:var(--muted-fg)]">
                  {d.mimeType} • {formatBytes(d.sizeBytes)}
                </div>
                {d.mimeType.startsWith('image/') ? (
                  <img
                    src={toDisplaySrc(d.storageRef)}
                    alt={d.fileName}
                    className="mt-2 h-24 w-auto rounded-md object-cover"
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(toDisplaySrc(d.storageRef), '_blank', 'noopener,noreferrer')}
                >
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => {
                    const ok = window.confirm(`Delete "${d.fileName}"?`)
                    if (!ok) return
                    deleteCustomerDocument(d.id)
                    pushToast({ kind: 'info', title: 'Document deleted', message: 'Removed.' })
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

