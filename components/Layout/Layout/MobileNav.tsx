'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Compass, 
  Library, 
  Heart, 
  User,
  LogOut,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Compass, label: 'Explorar', href: '/explore' },
  { icon: Library, label: 'Biblioteca', href: '/library' },
  { icon: Heart, label: 'Favoritos', href: '/favorites' },
  { icon: User, label: 'Perfil', href: '/profile' },
]

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-black/95 backdrop-blur-xl shadow-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            WaveMusic
          </h1>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X size={22} />
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 w-full mt-4"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </div>
  )
}