'use client'

import { Sidebar } from '@/components/Layout/Sidebar'
import { Header } from '@/components/Layout/Layout/Header'
import { PlayerBar } from '@/components/Player/PlayerBar'
import { AuthGuard } from '@/components/Auth/AuthGuard'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 pb-8">
              {children}
            </main>
          </div>
        </div>
        <PlayerBar />
      </div>
    </AuthGuard>
  )
}