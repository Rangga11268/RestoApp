import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm',
        'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary',
        'transition-all duration-200',
        className
      )}
    />
  )
}
