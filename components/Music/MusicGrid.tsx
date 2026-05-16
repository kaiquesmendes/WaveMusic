'use client'

import { Musica } from '@/types'
import { MusicCard } from './MusicCard'
import { Skeleton } from '@/components/UI/Skeleton'

interface MusicGridProps {
  musicas: Musica[]
  loading?: boolean
  variant?: 'default' | 'featured' | 'compact'
}

export function MusicGrid({ musicas, loading = false, variant = 'default' }: MusicGridProps) {
  if (loading) {
    const skeletonCount = variant === 'compact' ? 6 : 12
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/10 aspect-square rounded-xl mb-3" />
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (musicas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-gray-400">Nenhuma música encontrada</p>
      </div>
    )
  }

  const gridClasses = variant === 'compact'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'

  return (
    <div className={gridClasses}>
      {musicas.map((music) => (
        <MusicCard key={music.id} music={music} variant={variant === 'compact' ? 'compact' : 'default'} />
      ))}
    </div>
  )
}