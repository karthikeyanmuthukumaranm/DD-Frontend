import type { InsuranceDb } from '../types/insurance'

const STORAGE_KEY = 'ddms.insurance.db'
const CURRENT_SCHEMA_VERSION = 2

function emptyDb(): InsuranceDb {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    companies: [],
    customers: [],
    policies: [],
    customerDocuments: [],
    leads: [],
  }
}

export function loadInsuranceDb(): InsuranceDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyDb()
    const parsed = JSON.parse(raw) as Partial<InsuranceDb> | null
    if (!parsed || typeof parsed !== 'object') return emptyDb()

    // v1: ensure arrays exist; tolerate older keys if any.
    const schemaVersion =
      typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : CURRENT_SCHEMA_VERSION

    const db: InsuranceDb = {
      schemaVersion,
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      policies: Array.isArray(parsed.policies) ? parsed.policies : [],
      customerDocuments: Array.isArray(parsed.customerDocuments) ? parsed.customerDocuments : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
    }

    return migrateInsuranceDb(db)
  } catch {
    return emptyDb()
  }
}

export function saveInsuranceDb(db: InsuranceDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function migrateInsuranceDb(db: InsuranceDb): InsuranceDb {
  let next: InsuranceDb = {
    ...db,
    leads: Array.isArray(db.leads) ? db.leads : [],
    policies: db.policies.map((p) => ({
      ...p,
      sumInsured: typeof p.sumInsured === 'number' ? p.sumInsured : 0,
      paymentMode: p.paymentMode ?? 'Annual',
      paymentTerm: p.paymentTerm ?? '',
      policyTerm: p.policyTerm ?? '',
    })),
  }

  if (typeof next.schemaVersion !== 'number' || next.schemaVersion < 1) {
    next = { ...next, schemaVersion: 1 }
  }

  if (next.schemaVersion < 2) {
    next = { ...next, schemaVersion: 2, leads: next.leads ?? [] }
  }

  if (next.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    next = { ...next, schemaVersion: CURRENT_SCHEMA_VERSION }
  }

  return next
}

export function clearInsuranceDb() {
  localStorage.removeItem(STORAGE_KEY)
}

