import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition'
  const variants: Record<Variant, string> = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-white border border-gray-200 hover:bg-gray-50',
    ghost: 'bg-transparent hover:bg-gray-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  const cls = `${base} ${variants[variant]} ${className}`
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
