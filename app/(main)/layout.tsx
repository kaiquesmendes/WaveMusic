'use client'

import { Sidebar } from '@/components/Layout/Sidebar'
import { Header } from '@/components/Layout/Layout/Header'
import { PlayerBar } from '@/components/Player/PlayerBar'
import { AuthGuard } from '@/components/Auth/AuthGuard'
import { useEffect } from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Força o fundo preto no iOS para evitar cantos brancos
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#000000'
    document.body.style.backgroundColor = '#000000'
    
    return () => {
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = ''
    }
  }, [])

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col overflow-hidden bg-black">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto overscroll-contain">
              <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-28">
                {children}
              </div>
            </main>
          </div>
        </div>
        <PlayerBar />
      </div>
    </AuthGuard>
  )
}