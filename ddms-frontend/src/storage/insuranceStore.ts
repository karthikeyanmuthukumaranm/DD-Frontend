import { SQLiteConnection } from '@capacitor-community/sqlite'
import type { Company, Customer, CustomerDocument, InsuranceDb, Lead, Policy } from '../types/insurance'
import { isNativeApp } from './platform'

const CURRENT_SCHEMA_VERSION = 2

const LS_KEY = 'ddms.insurance.db'
const DB_NAME = 'insurance_manager'

const PAYMENT_MODES = new Set(['Annual', 'Half-Yearly', 'Quarterly', 'Monthly'])

function normalizePolicy(p: Record<string, unknown>): Policy {
  const pm = p.paymentMode
  return {
    id: String(p.id),
    policyNumber: String(p.policyNumber),
    customerId: String(p.customerId),
    companyId: String(p.companyId),
    premiumAmount: Number(p.premiumAmount),
    sumInsured: typeof p.sumInsured === 'number' ? p.sumInsured : 0,
    paymentMode: typeof pm === 'string' && PAYMENT_MODES.has(pm) ? (pm as Policy['paymentMode']) : 'Annual',
    paymentTerm: typeof p.paymentTerm === 'string' ? p.paymentTerm : '',
    policyTerm: typeof p.policyTerm === 'string' ? p.policyTerm : '',
    startDateISO: String(p.startDateISO),
    dueDateISO: String(p.dueDateISO),
    notes: p.notes == null ? undefined : String(p.notes),
    createdAtISO: String(p.createdAtISO),
    updatedAtISO: String(p.updatedAtISO),
  }
}

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

function migrateJsonDb(parsed: Partial<InsuranceDb> | null): InsuranceDb {
  if (!parsed || typeof parsed !== 'object') return emptyDb()
  const schemaVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1
  const policiesRaw = Array.isArray(parsed.policies) ? parsed.policies : []
  const policies = policiesRaw.map((x) => normalizePolicy(x as Record<string, unknown>))
  const leadsRaw = Array.isArray(parsed.leads) ? parsed.leads : []
  const leads = leadsRaw.map((l) => normalizeLead(l as Record<string, unknown>))
  return {
    schemaVersion: schemaVersion < CURRENT_SCHEMA_VERSION ? CURRENT_SCHEMA_VERSION : schemaVersion,
    companies: Array.isArray(parsed.companies) ? (parsed.companies as Company[]) : [],
    customers: Array.isArray(parsed.customers) ? (parsed.customers as Customer[]) : [],
    policies,
    customerDocuments: Array.isArray(parsed.customerDocuments) ? (parsed.customerDocuments as CustomerDocument[]) : [],
    leads,
  }
}

function normalizeLead(l: Record<string, unknown>): Lead {
  const st = l.status
  return {
    id: String(l.id),
    name: String(l.name),
    contactPhone: String(l.contactPhone),
    contactEmail: l.contactEmail == null ? undefined : String(l.contactEmail),
    address: l.address == null ? undefined : String(l.address),
    interestedProduct: String(l.interestedProduct),
    followUpDateISO: String(l.followUpDateISO),
    notes: l.notes == null ? undefined : String(l.notes),
    status: st === 'converted' ? 'converted' : 'open',
    createdAtISO: String(l.createdAtISO),
    updatedAtISO: String(l.updatedAtISO),
  }
}

function loadFromLocalStorage(): InsuranceDb {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyDb()
    const parsed = JSON.parse(raw) as Partial<InsuranceDb> | null
    return migrateJsonDb(parsed)
  } catch {
    return emptyDb()
  }
}

function saveToLocalStorage(db: InsuranceDb) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ...db, schemaVersion: CURRENT_SCHEMA_VERSION }))
}

type SqlRow = Record<string, unknown>

const sqlite = new SQLiteConnection((window as unknown as { CapacitorSQLite?: unknown }).CapacitorSQLite)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePolicyColumns(db: any) {
  const res = await db.query('PRAGMA table_info(policies)')
  const cols = new Set((res.values ?? []).map((r: SqlRow) => String(r.name)))
  const add: Array<[string, string]> = [
    ['sumInsured', 'REAL DEFAULT 0'],
    ['paymentMode', "TEXT DEFAULT 'Annual'"],
    ['paymentTerm', "TEXT DEFAULT ''"],
    ['policyTerm', "TEXT DEFAULT ''"],
  ]
  for (const [name, def] of add) {
    if (!cols.has(name)) {
      await db.execute(`ALTER TABLE policies ADD COLUMN ${name} ${def}`)
    }
  }
}

async function openDb() {
  const db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', CURRENT_SCHEMA_VERSION, false)
  await db.open()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      createdAtISO TEXT NOT NULL,
      updatedAtISO TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      dateOfBirthISO TEXT,
      anniversaryDateISO TEXT,
      createdAtISO TEXT NOT NULL,
      updatedAtISO TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      policyNumber TEXT NOT NULL,
      customerId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      premiumAmount REAL NOT NULL,
      startDateISO TEXT NOT NULL,
      dueDateISO TEXT NOT NULL,
      notes TEXT,
      createdAtISO TEXT NOT NULL,
      updatedAtISO TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_documents (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      storageRef TEXT NOT NULL,
      createdAtISO TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contactPhone TEXT NOT NULL,
      contactEmail TEXT,
      address TEXT,
      interestedProduct TEXT NOT NULL,
      followUpDateISO TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL,
      createdAtISO TEXT NOT NULL,
      updatedAtISO TEXT NOT NULL
    );
  `)
  await ensurePolicyColumns(db)
  await db.run('INSERT OR REPLACE INTO meta(k,v) VALUES(?,?)', ['schemaVersion', String(CURRENT_SCHEMA_VERSION)])
  return db
}

function mapCompany(r: SqlRow): Company {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description == null ? undefined : String(r.description),
    createdAtISO: String(r.createdAtISO),
    updatedAtISO: String(r.updatedAtISO),
  }
}

function mapCustomer(r: SqlRow): Customer {
  return {
    id: String(r.id),
    fullName: String(r.fullName),
    phoneNumber: String(r.phoneNumber),
    email: r.email == null ? undefined : String(r.email),
    address: String(r.address),
    dateOfBirthISO: r.dateOfBirthISO == null ? undefined : String(r.dateOfBirthISO),
    anniversaryDateISO: r.anniversaryDateISO == null ? undefined : String(r.anniversaryDateISO),
    createdAtISO: String(r.createdAtISO),
    updatedAtISO: String(r.updatedAtISO),
  }
}

function mapPolicy(r: SqlRow): Policy {
  return normalizePolicy(r)
}

function mapCustomerDocument(r: SqlRow): CustomerDocument {
  return {
    id: String(r.id),
    customerId: String(r.customerId),
    fileName: String(r.fileName),
    mimeType: String(r.mimeType),
    sizeBytes: Number(r.sizeBytes),
    storageRef: String(r.storageRef),
    createdAtISO: String(r.createdAtISO),
  }
}

function mapLead(r: SqlRow): Lead {
  return normalizeLead(r)
}

export type InsuranceStore = {
  load: () => Promise<InsuranceDb>
  persistAll: (db: InsuranceDb) => Promise<void>
  clearAll: () => Promise<void>
}

export function createInsuranceStore(): InsuranceStore {
  if (!isNativeApp()) {
    return {
      load: async () => loadFromLocalStorage(),
      persistAll: async (db) => saveToLocalStorage({ ...db, schemaVersion: CURRENT_SCHEMA_VERSION }),
      clearAll: async () => localStorage.removeItem(LS_KEY),
    }
  }

  return {
    load: async () => {
      const db = await openDb()
      const companiesRes = await db.query('SELECT * FROM companies')
      const customersRes = await db.query('SELECT * FROM customers')
      const policiesRes = await db.query('SELECT * FROM policies')
      const docsRes = await db.query('SELECT * FROM customer_documents')
      let leadsRes
      try {
        leadsRes = await db.query('SELECT * FROM leads')
      } catch {
        leadsRes = { values: [] }
      }
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        companies: (companiesRes.values ?? []).map(mapCompany),
        customers: (customersRes.values ?? []).map(mapCustomer),
        policies: (policiesRes.values ?? []).map(mapPolicy),
        customerDocuments: (docsRes.values ?? []).map(mapCustomerDocument),
        leads: (leadsRes.values ?? []).map(mapLead),
      }
    },
    persistAll: async (next) => {
      const db = await openDb()
      await db.execute('BEGIN TRANSACTION;')
      try {
        await db.execute(
          'DELETE FROM leads; DELETE FROM customer_documents; DELETE FROM policies; DELETE FROM customers; DELETE FROM companies;',
        )
        for (const c of next.companies) {
          await db.run(
            'INSERT INTO companies(id,name,description,createdAtISO,updatedAtISO) VALUES(?,?,?,?,?)',
            [c.id, c.name, c.description ?? null, c.createdAtISO, c.updatedAtISO],
          )
        }
        for (const c of next.customers) {
          await db.run(
            'INSERT INTO customers(id,fullName,phoneNumber,email,address,dateOfBirthISO,anniversaryDateISO,createdAtISO,updatedAtISO) VALUES(?,?,?,?,?,?,?,?,?)',
            [
              c.id,
              c.fullName,
              c.phoneNumber,
              c.email ?? null,
              c.address,
              c.dateOfBirthISO ?? null,
              c.anniversaryDateISO ?? null,
              c.createdAtISO,
              c.updatedAtISO,
            ],
          )
        }
        for (const p of next.policies) {
          await db.run(
            'INSERT INTO policies(id,policyNumber,customerId,companyId,premiumAmount,sumInsured,paymentMode,paymentTerm,policyTerm,startDateISO,dueDateISO,notes,createdAtISO,updatedAtISO) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
              p.id,
              p.policyNumber,
              p.customerId,
              p.companyId,
              p.premiumAmount,
              p.sumInsured,
              p.paymentMode,
              p.paymentTerm,
              p.policyTerm,
              p.startDateISO,
              p.dueDateISO,
              p.notes ?? null,
              p.createdAtISO,
              p.updatedAtISO,
            ],
          )
        }
        for (const d of next.customerDocuments) {
          await db.run(
            'INSERT INTO customer_documents(id,customerId,fileName,mimeType,sizeBytes,storageRef,createdAtISO) VALUES(?,?,?,?,?,?,?)',
            [d.id, d.customerId, d.fileName, d.mimeType, d.sizeBytes, d.storageRef, d.createdAtISO],
          )
        }
        for (const l of next.leads) {
          await db.run(
            'INSERT INTO leads(id,name,contactPhone,contactEmail,address,interestedProduct,followUpDateISO,notes,status,createdAtISO,updatedAtISO) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            [
              l.id,
              l.name,
              l.contactPhone,
              l.contactEmail ?? null,
              l.address ?? null,
              l.interestedProduct,
              l.followUpDateISO,
              l.notes ?? null,
              l.status,
              l.createdAtISO,
              l.updatedAtISO,
            ],
          )
        }
        await db.execute('COMMIT;')
      } catch (e) {
        await db.execute('ROLLBACK;')
        throw e
      }
    },
    clearAll: async () => {
      const db = await openDb()
      await db.execute(
        'DELETE FROM leads; DELETE FROM customer_documents; DELETE FROM policies; DELETE FROM customers; DELETE FROM companies;',
      )
    },
  }
}
