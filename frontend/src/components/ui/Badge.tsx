import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: BadgeVariant
}

export default function Badge({
  children,
  className = '',
  variant = 'default'
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-paper-2 text-ink-2',
    primary: 'bg-accent-light text-accent',
    success: 'bg-success-light text-success',
    danger: 'bg-danger-light text-danger',
    warning: 'bg-warning-light text-warning',
    info: 'bg-blue-100 text-blue-700',
    muted: 'bg-gray-100 text-gray-500',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}