import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-card rounded-3xl p-5 shadow-card-glow ${className}`}
    >
      {children}
    </div>
  )
}
