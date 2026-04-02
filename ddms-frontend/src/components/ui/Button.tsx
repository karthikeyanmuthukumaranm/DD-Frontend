import React from 'react'
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  leftIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  leftIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-60 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-9 px-4 text-sm' : 'h-11 px-6 text-sm',
        variant === 'primary' &&
          'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
        variant === 'secondary' &&
          'bg-[color:var(--card)] text-[color:var(--card-fg)] ring-1 ring-[color:var(--border)] hover:bg-[color:var(--muted)] shadow-sm',
        variant === 'ghost' &&
          'bg-transparent text-[color:var(--muted-fg)] hover:bg-[color:var(--muted)]',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  )
}


