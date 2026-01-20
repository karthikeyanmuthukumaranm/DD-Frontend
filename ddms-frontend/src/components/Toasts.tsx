import React from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useToasts } from '../contexts/ToastContext'

export function Toasts() {
  const { toasts, dismissToast } = useToasts()

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'rounded-xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200',
            'p-4',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={clsx(
                  'text-sm font-semibold',
                  t.kind === 'success' && 'text-green-700',
                  t.kind === 'warning' && 'text-amber-700',
                  t.kind === 'error' && 'text-red-700',
                  t.kind === 'info' && 'text-slate-900',
                )}
              >
                {t.title}
              </div>
              {t.message ? <div className="mt-1 text-xs text-slate-600">{t.message}</div> : null}
            </div>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


