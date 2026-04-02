import React from 'react'
import clsx from 'clsx'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-[color:var(--card)] text-[color:var(--card-fg)] ring-1 ring-[color:var(--border)] shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-[color:var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[color:var(--fg)]">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-[color:var(--muted-fg)]">{subtitle}</div> : null}
      </div>
      {right ? <div className="min-w-0 w-full sm:w-auto sm:shrink-0">{right}</div> : null}
    </div>
  )
}

export function CardBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={clsx('p-5', className)}>{children}</div>
}


