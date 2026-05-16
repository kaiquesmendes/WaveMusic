import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-xl p-6 transition-all duration-300 ${
        hover ? 'hover:scale-105 hover:shadow-2xl' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}