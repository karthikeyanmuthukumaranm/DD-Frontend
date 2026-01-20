import type { DocumentItem } from '../types/document'

export const mockDocuments: DocumentItem[] = [
  {
    id: 'DOC-001',
    name: 'Vendor Agreement - Acme Corp.pdf',
    deadlineISO: '2026-01-22',
    completed: false,
    uploadedAtISO: '2026-01-10T09:30:00Z',
  },
  {
    id: 'DOC-002',
    name: 'Compliance Checklist Q1.docx',
    deadlineISO: '2026-01-12',
    completed: false,
    uploadedAtISO: '2026-01-05T14:05:00Z',
  },
  {
    id: 'DOC-003',
    name: 'Insurance Renewal Notice.png',
    deadlineISO: '2026-02-03',
    completed: false,
    uploadedAtISO: '2026-01-11T18:10:00Z',
  },
  {
    id: 'DOC-004',
    name: 'Audit Closure Report.pdf',
    deadlineISO: '2026-01-08',
    completed: true,
    uploadedAtISO: '2025-12-30T11:15:00Z',
  },
  {
    id: 'DOC-005',
    name: 'Client SLA Addendum.jpeg',
    deadlineISO: '2026-01-18',
    completed: false,
    uploadedAtISO: '2026-01-13T10:00:00Z',
  },
]


