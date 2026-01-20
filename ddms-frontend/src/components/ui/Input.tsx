import React from 'react'
import clsx from 'clsx'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode
}

export function Input({ className, leftIcon, ...props }: Props) {
  return (
    <div className={clsx('relative', className)}>
      {leftIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          {leftIcon}
        </div>
      ) : null}
      <input
        className={clsx(
          'w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900',
          'ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40',
          leftIcon ? 'pl-9' : '',
        )}
        {...props}
      />
    </div>
  )
}


