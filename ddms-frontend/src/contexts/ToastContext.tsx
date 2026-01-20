import React, { createContext, useContext, useMemo, useState } from 'react'

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

export type Toast = {
  id: string
  kind: ToastKind
  title: string
  message?: string
  createdAt: number
}

type ToastContextValue = {
  toasts: Toast[]
  pushToast: (t: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function uid() {
  return Math.random().toString(16).slice(2)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const value = useMemo<ToastContextValue>(() => {
    return {
      toasts,
      pushToast: (t) => {
        const id = t.id ?? uid()
        const toast: Toast = { ...t, id, createdAt: Date.now() }
        setToasts((prev) => [toast, ...prev].slice(0, 4))
        window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500)
      },
      dismissToast: (id) => setToasts((prev) => prev.filter((x) => x.id !== id)),
    }
  }, [toasts])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}


