import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-lg',
  }

  const variants: Record<Variant, string> = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    secondary: 'bg-surface border border-rule text-ink hover:bg-paper-2',
    ghost: 'bg-transparent text-ink-2 hover:bg-paper-2',
    danger: 'bg-danger text-white hover:opacity-90',
  }

  const cls = cn(base, sizes[size], variants[variant], className)

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}