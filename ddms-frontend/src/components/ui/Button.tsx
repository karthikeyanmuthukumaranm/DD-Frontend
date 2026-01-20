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
        'focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:opacity-60 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-9 px-4 text-sm' : 'h-11 px-6 text-sm',
        variant === 'primary' &&
          'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
        variant === 'secondary' &&
          'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 shadow-sm',
        variant === 'ghost' &&
          'bg-transparent text-slate-700 hover:bg-slate-100',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  )
}


