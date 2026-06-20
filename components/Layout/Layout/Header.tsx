'use client'

import { useState } from 'react'
import { Menu, User, ChevronDown } from 'lucide-react'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/Search/SearchBar'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { userData, user } = useAuth()
  const router = useRouter()

  const handleProfileClick = () => {
    router.push('/profile')
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/10 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Menu Button Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-all"
          >
            <Menu size={22} />
          </button>

          {/* Search - Desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 glass-dark rounded-full py-1.5 pl-1.5 pr-3 hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold">
                {userData?.nome?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-white hidden sm:inline font-medium">
              {userData?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Search Bar Mobile (expanded) */}
        <div className="md:hidden mt-3">
          <SearchBar />
        </div>
      </header>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}