import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ children, variant = 'primary', loading = false, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  return (
    <button
      className={`px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]}`}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}