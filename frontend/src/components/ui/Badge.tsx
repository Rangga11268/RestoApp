import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'glass'

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
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-amber-100 text-amber-950 font-medium',
    info: 'bg-blue-100 text-blue-700 font-medium',
    glass: 'glass border border-white/20 text-slate-900 shadow-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
