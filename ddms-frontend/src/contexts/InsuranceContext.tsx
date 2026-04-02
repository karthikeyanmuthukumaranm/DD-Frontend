import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Company, Customer, CustomerDocument, Id, InsuranceDb, Lead, PaymentMode, Policy } from '../types/insurance'
import { normalizeEmail, normalizePhoneE164 } from '../utils/validators'
import { createInsuranceStore } from '../storage/insuranceStore'
import { initLocalNotifications, rescheduleFromDb } from '../utils/localNotifications'

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix: string): Id {
  return `${prefix}-${crypto.randomUUID()}`
}

type InsuranceContextValue = {
  db: InsuranceDb

  companies: Company[]
  customers: Customer[]
  policies: Policy[]
  customerDocuments: CustomerDocument[]
  leads: Lead[]

  exportBackup: () => Promise<InsuranceDb>
  restoreBackup: (db: InsuranceDb) => Promise<void>

  addCompany: (input: { name: string; description?: string }) => Company
  updateCompany: (id: Id, patch: Partial<Pick<Company, 'name' | 'description'>>) => void
  deleteCompany: (id: Id) => void

  addCustomer: (input: {
    fullName: string
    phoneNumber: string
    email?: string
    address: string
    dateOfBirthISO?: string
    anniversaryDateISO?: string
  }) => Customer
  updateCustomer: (
    id: Id,
    patch: Partial<
      Pick<
        Customer,
        'fullName' | 'phoneNumber' | 'email' | 'address' | 'dateOfBirthISO' | 'anniversaryDateISO'
      >
    >,
  ) => void
  deleteCustomer: (id: Id) => void

  addPolicy: (input: {
    policyNumber: string
    customerId: Id
    companyId: Id
    premiumAmount: number
    sumInsured?: number
    paymentMode?: PaymentMode
    paymentTerm?: string
    policyTerm?: string
    startDateISO: string
    dueDateISO: string
    notes?: string
  }) => Policy
  updatePolicy: (
    id: Id,
    patch: Partial<
      Pick<
        Policy,
        | 'policyNumber'
        | 'customerId'
        | 'companyId'
        | 'premiumAmount'
        | 'sumInsured'
        | 'paymentMode'
        | 'paymentTerm'
        | 'policyTerm'
        | 'startDateISO'
        | 'dueDateISO'
        | 'notes'
      >
    >,
  ) => void
  deletePolicy: (id: Id) => void

  addCustomerDocumentMeta: (input: {
    customerId: Id
    fileName: string
    mimeType: string
    sizeBytes: number
    storageRef: string
  }) => CustomerDocument
  deleteCustomerDocument: (id: Id) => void

  addLead: (input: {
    name: string
    contactPhone: string
    contactEmail?: string
    address?: string
    interestedProduct: string
    followUpDateISO: string
    notes?: string
  }) => Lead
  updateLead: (
    id: Id,
    patch: Partial<
      Pick<Lead, 'name' | 'contactPhone' | 'contactEmail' | 'address' | 'interestedProduct' | 'followUpDateISO' | 'notes' | 'status'>
    >,
  ) => void
  deleteLead: (id: Id) => void
  /** Creates a customer from the lead and removes the lead. */
  convertLeadToCustomer: (leadId: Id, address: string) => Customer | null
}

const InsuranceContext = createContext<InsuranceContextValue | null>(null)

export function InsuranceProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef(createInsuranceStore())
  const store = storeRef.current

  const [db, setDb] = useState<InsuranceDb>(() => ({
    schemaVersion: 2,
    companies: [],
    customers: [],
    policies: [],
    customerDocuments: [],
    leads: [],
  }))
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    void initLocalNotifications()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loaded = await store.load()
      if (cancelled) return
      setDb(loaded)
      setIsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [store])

  useEffect(() => {
    if (!isReady) return
    const t = window.setTimeout(() => {
      void rescheduleFromDb(db)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [db, isReady])

  const persistTimer = useRef<number | null>(null)
  const persistLatest = useRef<InsuranceDb | null>(null)

  function schedulePersist(next: InsuranceDb) {
    persistLatest.current = next
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(async () => {
      const snapshot = persistLatest.current
      if (!snapshot) return
      await store.persistAll(snapshot)
    }, 250)
  }

  const flushPendingPersist = useCallback(async () => {
    if (persistTimer.current) {
      window.clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    const snap = persistLatest.current ?? db
    await store.persistAll(snap)
    persistLatest.current = null
  }, [db, store])

  const value = useMemo<InsuranceContextValue>(() => {
    return {
      db,
      companies: db.companies,
      customers: db.customers,
      policies: db.policies,
      customerDocuments: db.customerDocuments,
      leads: db.leads,

      exportBackup: async () => {
        await flushPendingPersist()
        return await store.load()
      },
      restoreBackup: async (incoming) => {
        if (persistTimer.current) {
          window.clearTimeout(persistTimer.current)
          persistTimer.current = null
        }
        persistLatest.current = null
        const normalized: InsuranceDb = {
          ...incoming,
          leads: Array.isArray(incoming.leads) ? incoming.leads : [],
          policies: incoming.policies.map((p) => ({
            ...p,
            sumInsured: typeof p.sumInsured === 'number' ? p.sumInsured : 0,
            paymentMode: p.paymentMode ?? 'Annual',
            paymentTerm: p.paymentTerm ?? '',
            policyTerm: p.policyTerm ?? '',
          })),
        }
        await store.persistAll(normalized)
        setDb(normalized)
      },

      addCompany: ({ name, description }) => {
        const createdAtISO = nowIso()
        const company: Company = {
          id: newId('COMP'),
          name: name.trim(),
          description: description?.trim() || undefined,
          createdAtISO,
          updatedAtISO: createdAtISO,
        }
        setDb((prev) => {
          const next = { ...prev, companies: [company, ...prev.companies] }
          schedulePersist(next)
          return next
        })
        return company
      },
      updateCompany: (id, patch) => {
        setDb((prev) => {
          const next = {
            ...prev,
            companies: prev.companies.map((c) =>
              c.id !== id
                ? c
                : {
                    ...c,
                    ...('name' in patch ? { name: patch.name?.trim() ?? c.name } : null),
                    ...('description' in patch
                      ? { description: patch.description?.trim() || undefined }
                      : null),
                    updatedAtISO: nowIso(),
                  },
            ),
          }
          schedulePersist(next)
          return next
        })
      },
      deleteCompany: (id) => {
        setDb((prev) => {
          const next = {
            ...prev,
            companies: prev.companies.filter((c) => c.id !== id),
            policies: prev.policies.filter((p) => p.companyId !== id),
          }
          schedulePersist(next)
          return next
        })
      },

      addCustomer: (input) => {
        const createdAtISO = nowIso()
        const customer: Customer = {
          id: newId('CUST'),
          fullName: input.fullName.trim(),
          phoneNumber: normalizePhoneE164(input.phoneNumber),
          email: input.email ? normalizeEmail(input.email) : undefined,
          address: input.address.trim(),
          dateOfBirthISO: input.dateOfBirthISO || undefined,
          anniversaryDateISO: input.anniversaryDateISO || undefined,
          createdAtISO,
          updatedAtISO: createdAtISO,
        }
        setDb((prev) => {
          const next = { ...prev, customers: [customer, ...prev.customers] }
          schedulePersist(next)
          return next
        })
        return customer
      },
      updateCustomer: (id, patch) => {
        setDb((prev) => {
          const next = {
            ...prev,
            customers: prev.customers.map((c) =>
              c.id !== id
                ? c
                : {
                    ...c,
                    ...('fullName' in patch ? { fullName: patch.fullName?.trim() ?? c.fullName } : null),
                    ...('phoneNumber' in patch
                      ? { phoneNumber: patch.phoneNumber ? normalizePhoneE164(patch.phoneNumber) : c.phoneNumber }
                      : null),
                    ...('email' in patch
                      ? { email: patch.email ? normalizeEmail(patch.email) : undefined }
                      : null),
                    ...('address' in patch ? { address: patch.address?.trim() ?? c.address } : null),
                    ...('dateOfBirthISO' in patch
                      ? { dateOfBirthISO: patch.dateOfBirthISO || undefined }
                      : null),
                    ...('anniversaryDateISO' in patch
                      ? { anniversaryDateISO: patch.anniversaryDateISO || undefined }
                      : null),
                    updatedAtISO: nowIso(),
                  },
            ),
          }
          schedulePersist(next)
          return next
        })
      },
      deleteCustomer: (id) => {
        setDb((prev) => {
          const next = {
            ...prev,
            customers: prev.customers.filter((c) => c.id !== id),
            policies: prev.policies.filter((p) => p.customerId !== id),
            customerDocuments: prev.customerDocuments.filter((d) => d.customerId !== id),
          }
          schedulePersist(next)
          return next
        })
      },

      addPolicy: (input) => {
        const createdAtISO = nowIso()
        const policy: Policy = {
          id: newId('POL'),
          policyNumber: input.policyNumber.trim(),
          customerId: input.customerId,
          companyId: input.companyId,
          premiumAmount: Number.isFinite(input.premiumAmount) ? input.premiumAmount : 0,
          sumInsured: Number.isFinite(input.sumInsured) ? (input.sumInsured as number) : 0,
          paymentMode: input.paymentMode ?? 'Annual',
          paymentTerm: input.paymentTerm?.trim() ?? '',
          policyTerm: input.policyTerm?.trim() ?? '',
          startDateISO: input.startDateISO,
          dueDateISO: input.dueDateISO,
          notes: input.notes?.trim() || undefined,
          createdAtISO,
          updatedAtISO: createdAtISO,
        }
        setDb((prev) => {
          const next = { ...prev, policies: [policy, ...prev.policies] }
          schedulePersist(next)
          return next
        })
        return policy
      },
      updatePolicy: (id, patch) => {
        setDb((prev) => {
          const next = {
            ...prev,
            policies: prev.policies.map((p) =>
              p.id !== id
                ? p
                : {
                    ...p,
                    ...('policyNumber' in patch
                      ? { policyNumber: patch.policyNumber?.trim() ?? p.policyNumber }
                      : null),
                    ...('customerId' in patch ? { customerId: patch.customerId ?? p.customerId } : null),
                    ...('companyId' in patch ? { companyId: patch.companyId ?? p.companyId } : null),
                    ...('premiumAmount' in patch
                      ? {
                          premiumAmount:
                            typeof patch.premiumAmount === 'number' ? patch.premiumAmount : p.premiumAmount,
                        }
                      : null),
                    ...('sumInsured' in patch
                      ? { sumInsured: typeof patch.sumInsured === 'number' ? patch.sumInsured : p.sumInsured }
                      : null),
                    ...('paymentMode' in patch ? { paymentMode: patch.paymentMode ?? p.paymentMode } : null),
                    ...('paymentTerm' in patch
                      ? { paymentTerm: patch.paymentTerm?.trim() ?? p.paymentTerm }
                      : null),
                    ...('policyTerm' in patch ? { policyTerm: patch.policyTerm?.trim() ?? p.policyTerm } : null),
                    ...('startDateISO' in patch ? { startDateISO: patch.startDateISO ?? p.startDateISO } : null),
                    ...('dueDateISO' in patch ? { dueDateISO: patch.dueDateISO ?? p.dueDateISO } : null),
                    ...('notes' in patch ? { notes: patch.notes?.trim() || undefined } : null),
                    updatedAtISO: nowIso(),
                  },
            ),
          }
          schedulePersist(next)
          return next
        })
      },
      deletePolicy: (id) => {
        setDb((prev) => {
          const next = { ...prev, policies: prev.policies.filter((p) => p.id !== id) }
          schedulePersist(next)
          return next
        })
      },

      addCustomerDocumentMeta: (input) => {
        const doc: CustomerDocument = {
          id: newId('DOC'),
          customerId: input.customerId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          storageRef: input.storageRef,
          createdAtISO: nowIso(),
        }
        setDb((prev) => {
          const next = { ...prev, customerDocuments: [doc, ...prev.customerDocuments] }
          schedulePersist(next)
          return next
        })
        return doc
      },
      deleteCustomerDocument: (id) => {
        setDb((prev) => {
          const next = { ...prev, customerDocuments: prev.customerDocuments.filter((d) => d.id !== id) }
          schedulePersist(next)
          return next
        })
      },

      addLead: (input) => {
        const createdAtISO = nowIso()
        const lead: Lead = {
          id: newId('LEAD'),
          name: input.name.trim(),
          contactPhone: normalizePhoneE164(input.contactPhone),
          contactEmail: input.contactEmail?.trim() ? normalizeEmail(input.contactEmail.trim()) : undefined,
          address: input.address?.trim() || undefined,
          interestedProduct: input.interestedProduct.trim(),
          followUpDateISO: input.followUpDateISO,
          notes: input.notes?.trim() || undefined,
          status: 'open',
          createdAtISO,
          updatedAtISO: createdAtISO,
        }
        setDb((prev) => {
          const next = { ...prev, leads: [lead, ...prev.leads] }
          schedulePersist(next)
          return next
        })
        return lead
      },
      updateLead: (id, patch) => {
        setDb((prev) => {
          const next = {
            ...prev,
            leads: prev.leads.map((l) =>
              l.id !== id
                ? l
                : {
                    ...l,
                    ...('name' in patch ? { name: patch.name?.trim() ?? l.name } : null),
                    ...('contactPhone' in patch
                      ? { contactPhone: normalizePhoneE164(patch.contactPhone ?? l.contactPhone) }
                      : null),
                    ...('contactEmail' in patch
                      ? {
                          contactEmail: patch.contactEmail?.trim()
                            ? normalizeEmail(patch.contactEmail.trim())
                            : undefined,
                        }
                      : null),
                    ...('address' in patch ? { address: patch.address?.trim() || undefined } : null),
                    ...('interestedProduct' in patch
                      ? { interestedProduct: patch.interestedProduct?.trim() ?? l.interestedProduct }
                      : null),
                    ...('followUpDateISO' in patch
                      ? { followUpDateISO: patch.followUpDateISO ?? l.followUpDateISO }
                      : null),
                    ...('notes' in patch ? { notes: patch.notes?.trim() || undefined } : null),
                    ...('status' in patch ? { status: patch.status ?? l.status } : null),
                    updatedAtISO: nowIso(),
                  },
            ),
          }
          schedulePersist(next)
          return next
        })
      },
      deleteLead: (id) => {
        setDb((prev) => {
          const next = { ...prev, leads: prev.leads.filter((l) => l.id !== id) }
          schedulePersist(next)
          return next
        })
      },
      convertLeadToCustomer: (leadId, address) => {
        const addr = address.trim()
        if (addr.length < 5) return null
        let created: Customer | null = null
        setDb((prev) => {
          const lead = prev.leads.find((l) => l.id === leadId && l.status === 'open')
          if (!lead) return prev
          const createdAtISO = nowIso()
          const customer: Customer = {
            id: newId('CUST'),
            fullName: lead.name,
            phoneNumber: lead.contactPhone,
            email: lead.contactEmail,
            address: addr,
            dateOfBirthISO: undefined,
            anniversaryDateISO: undefined,
            createdAtISO,
            updatedAtISO: createdAtISO,
          }
          created = customer
          const next = {
            ...prev,
            customers: [customer, ...prev.customers],
            leads: prev.leads.filter((l) => l.id !== leadId),
          }
          schedulePersist(next)
          return next
        })
        return created
      },
    }
  }, [db, store, flushPendingPersist])

  return <InsuranceContext.Provider value={value}>{children}</InsuranceContext.Provider>
}

export function useInsurance() {
  const ctx = useContext(InsuranceContext)
  if (!ctx) throw new Error('useInsurance must be used within InsuranceProvider')
  return ctx
}
