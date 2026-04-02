export type Id = string

export type PaymentMode = 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly'

export const PAYMENT_MODES: PaymentMode[] = ['Annual', 'Half-Yearly', 'Quarterly', 'Monthly']

export type Company = {
  id: Id
  name: string
  description?: string
  createdAtISO: string
  updatedAtISO: string
}

export type Customer = {
  id: Id
  fullName: string
  phoneNumber: string
  email?: string
  address: string
  dateOfBirthISO?: string // YYYY-MM-DD
  anniversaryDateISO?: string // YYYY-MM-DD
  createdAtISO: string
  updatedAtISO: string
}

export type Policy = {
  id: Id
  policyNumber: string
  customerId: Id
  companyId: Id
  premiumAmount: number
  /** Sum insured / coverage amount */
  sumInsured: number
  paymentMode: PaymentMode
  /** e.g. premium payment term description */
  paymentTerm: string
  /** e.g. policy coverage term */
  policyTerm: string
  startDateISO: string // YYYY-MM-DD
  dueDateISO: string // YYYY-MM-DD (renewal due)
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

export type CustomerDocument = {
  id: Id
  customerId: Id
  fileName: string
  mimeType: string
  sizeBytes: number
  // For web this may be an object URL; for native this can be a filesystem path.
  storageRef: string
  createdAtISO: string
}

export type LeadStatus = 'open' | 'converted'

export type Lead = {
  id: Id
  name: string
  contactPhone: string
  contactEmail?: string
  /** Optional until conversion; used when converting to customer */
  address?: string
  interestedProduct: string
  followUpDateISO: string // YYYY-MM-DD
  notes?: string
  status: LeadStatus
  createdAtISO: string
  updatedAtISO: string
}

export type InsuranceDb = {
  schemaVersion: number
  companies: Company[]
  customers: Customer[]
  policies: Policy[]
  customerDocuments: CustomerDocument[]
  leads: Lead[]
}
