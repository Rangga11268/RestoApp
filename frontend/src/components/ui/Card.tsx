import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
}

export default function Card({
  children,
  className = '',
  variant = 'default'
}: CardProps) {
  const variants = {
    default: 'bg-surface border border-rule',
    outline: 'bg-transparent border border-rule'
  }

  return (
    <div className={cn('rounded-lg p-5', variants[variant], className)}>
      {children}
    </div>
  )
}