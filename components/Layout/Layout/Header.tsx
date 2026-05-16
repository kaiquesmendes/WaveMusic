'use client'

import { useState } from 'react'
import { Menu, User, ChevronDown } from 'lucide-react'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { userData, user } = useAuth()
  const router = useRouter()

  const handleProfileClick = () => {
    router.push('/profile')
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 glass rounded-full py-1.5 px-3 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xs font-bold">
                  {userData?.nome?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm text-white hidden sm:inline">
                {userData?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
              </span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}