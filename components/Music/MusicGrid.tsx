'use client'

import { Musica } from '@/types'
import { MusicCard } from './MusicCard'
import { MusicCardSkeleton } from '@/components/UI/Skeleton'

interface MusicGridProps {
  musicas: Musica[]
  loading?: boolean
}

export function MusicGrid({ musicas, loading = false }: MusicGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {[...Array(12)].map((_, i) => (
          <MusicCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (musicas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhuma música encontrada</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {musicas.map((music) => (
        <MusicCard key={music.id} music={music} />
      ))}
    </div>
  )
}