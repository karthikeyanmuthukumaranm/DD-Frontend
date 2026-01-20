import React, { createContext, useContext, useMemo, useState } from 'react'
import type { DocumentItem } from '../types/document'
import { mockDocuments } from '../data/mockDocuments'

type DocumentsContextValue = {
  documents: DocumentItem[]
  addDocument: (doc: DocumentItem) => void
  markCompleted: (id: string, completed: boolean) => void
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null)

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments)

  const value = useMemo<DocumentsContextValue>(() => {
    return {
      documents,
      addDocument: (doc) => setDocuments((prev) => [doc, ...prev]),
      markCompleted: (id, completed) =>
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, completed } : d)),
        ),
    }
  }, [documents])

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments must be used within DocumentsProvider')
  return ctx
}


