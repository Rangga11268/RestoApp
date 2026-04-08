import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'

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
    'inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3.5 text-base rounded-2xl',
  }

  const variants: Record<Variant, string> = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-orange-500/20 hover:scale-[1.02]',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-danger hover:bg-red-600 text-white shadow-md hover:shadow-red-500/20 hover:scale-[1.02]',
    glass: 'glass hover:bg-white/80 text-slate-800 border-white/50 shadow-sm',
  }

  const cls = cn(base, sizes[size], variants[variant], className)
  
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
