import React from 'react'
import clsx from 'clsx'

export function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-slate-100',
        'ring-1 ring-slate-200/60',
        className,
      )}
    />
  )
}


