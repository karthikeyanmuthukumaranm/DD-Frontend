import { useMemo, useState } from 'react'
import { BriefcaseBusiness, Pencil, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useInsurance } from '../contexts/InsuranceContext'
import { useToasts } from '../contexts/ToastContext'

export function CompaniesPage() {
  const { companies, addCompany, updateCompany, deleteCompany } = useInsurance()
  const { pushToast } = useToasts()

  const [isEditingId, setIsEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const sorted = useMemo(() => [...companies].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)), [companies])

  function resetForm() {
    setIsEditingId(null)
    setName('')
    setDescription('')
  }

  return (
    <div className="space-y-6 ddms-animate-fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Companies</h1>
          <div className="mt-1 text-sm text-slate-600">Add and manage insurance companies.</div>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <BriefcaseBusiness className="h-4 w-4" /> {companies.length}
        </div>
      </div>

      <Card>
        <CardHeader
          title={isEditingId ? 'Edit company' : 'Add company'}
          subtitle="Company description is optional."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Company Name</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ABC Insurance"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Description (optional)</div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Tip: keep names short for quick lookups in policy forms.
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => resetForm()}
                disabled={!isEditingId && !name && !description}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const trimmedName = name.trim()
                  if (!trimmedName) {
                    pushToast({ kind: 'error', title: 'Missing name', message: 'Company name is required.' })
                    return
                  }

                  if (isEditingId) {
                    updateCompany(isEditingId, { name: trimmedName, description: description.trim() || undefined })
                    pushToast({ kind: 'success', title: 'Company updated', message: 'Changes saved.' })
                  } else {
                    addCompany({ name: trimmedName, description: description.trim() || undefined })
                    pushToast({ kind: 'success', title: 'Company added', message: 'Company saved successfully.' })
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
        <CardHeader title="Company list" subtitle="Tap Edit to update details." />
        <CardBody>
          {sorted.length === 0 ? (
            <div className="text-sm text-slate-600">No companies yet. Add your first company above.</div>
          ) : (
            <div className="space-y-3">
              {sorted.map((c) => (
                <div
                  key={c.id}
                  className="ddms-animate-hover-lift flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{c.name}</div>
                    {c.description ? (
                      <div className="mt-1 text-xs text-slate-600 break-words">{c.description}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => {
                        setIsEditingId(c.id)
                        setName(c.name)
                        setDescription(c.description ?? '')
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        const ok = window.confirm(`Delete "${c.name}"? This also deletes its policies.`)
                        if (!ok) return
                        deleteCompany(c.id)
                        pushToast({ kind: 'info', title: 'Company deleted', message: 'Company removed.' })
                        if (isEditingId === c.id) resetForm()
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
    </div>
  )
}

