import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WaveMusic - Streaming de Música',
  description: 'Plataforma moderna de streaming de música',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WaveMusic',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Meta tags para corrigir cantos no iPhone */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WaveMusic" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="color-scheme" content="dark" />
        
        {/* Ícones para iPhone */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
      </head>
      <body className={`${inter.className} bg-black`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}