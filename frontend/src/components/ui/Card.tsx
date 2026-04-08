import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'premium' | 'glass' | 'outline'
  animated?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  variant = 'premium',
  animated = false
}: CardProps) {
  const base = 'rounded-[24px] p-6 transition-all duration-300'
  
  const variants = {
    premium: 'bg-white border border-slate-100 shadow-premium',
    glass: 'glass',
    outline: 'bg-transparent border border-slate-200'
  }

  const animation = animated ? 'hover:shadow-premium-hover hover:-translate-y-1' : ''

  return (
    <div className={cn(base, variants[variant], animation, className)}>
      {children}
    </div>
  )
}
