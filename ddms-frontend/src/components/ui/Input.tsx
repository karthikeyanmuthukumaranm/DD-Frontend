import React from 'react'
import clsx from 'clsx'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode
}

export function Input({ className, leftIcon, ...props }: Props) {
  return (
    <div className={clsx('relative', className)}>
      {leftIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[color:var(--muted-fg)]">
          {leftIcon}
        </div>
      ) : null}
      <input
        className={clsx(
          'w-full rounded-lg bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--card-fg)]',
          'ring-1 ring-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]',
          leftIcon ? 'pl-9' : '',
        )}
        {...props}
      />
    </div>
  )
}


