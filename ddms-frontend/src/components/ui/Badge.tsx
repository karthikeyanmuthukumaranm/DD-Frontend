import React from 'react'
import clsx from 'clsx'

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: React.ReactNode
  tone?: 'slate' | 'green' | 'amber' | 'red'
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tone === 'slate' && 'bg-slate-50 text-slate-700 ring-slate-200',
        tone === 'green' && 'bg-green-50 text-green-700 ring-green-200',
        tone === 'amber' && 'bg-amber-50 text-amber-700 ring-amber-200',
        tone === 'red' && 'bg-red-50 text-red-700 ring-red-200',
        className,
      )}
    >
      {children}
    </span>
  )
}


