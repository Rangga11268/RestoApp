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
        'w-full bg-surface rounded-lg border border-rule px-3 py-2 text-sm',
        'placeholder:text-ink-2/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
        'transition-colors',
        className
      )}
    />
  )
}