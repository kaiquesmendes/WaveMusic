'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Compass, 
  Library, 
  Heart, 
  Plus, 
  User,
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'
import { CreatePlaylistModal } from '@/components/Playlist/CreatePlaylistModal'

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Compass, label: 'Explorar', href: '/explore' },
  { icon: Library, label: 'Biblioteca', href: '/library' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex-shrink-0">
        <div className="p-6">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              WaveMusic
            </h1>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className="transition-transform group-hover:scale-110" />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10 mt-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 w-full group mb-1"
          >
            <Plus size={20} className="transition-transform group-hover:rotate-90" />
            <span className="text-sm">Criar Playlist</span>
          </button>

          <Link
            href="/favorites"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
              pathname === '/favorites'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-sm">Favoritos</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
              pathname === '/profile'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-sm">Perfil</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 w-full group mt-2"
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <CreatePlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}