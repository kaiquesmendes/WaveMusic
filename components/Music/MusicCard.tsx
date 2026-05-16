'use client'

import Image from 'next/image'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useState } from 'react'

interface MusicCardProps {
  music: Musica
  variant?: 'default' | 'compact'
}

export function MusicCard({ music, variant = 'default' }: MusicCardProps) {
  const { setCurrentSong } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)
  const isFavorite = favorites.includes(music.id)

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
          {music.url_capa ? (
            <Image src={music.url_capa} alt={music.titulo} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{music.titulo}</p>
          <p className="text-gray-400 text-xs truncate">{music.artista}</p>
        </div>
        <button
          onClick={() => toggleFavorite(music.id)}
          className={`p-1 rounded-full transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        {music.url_capa ? (
          <Image
            src={music.url_capa}
            alt={music.titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music size={32} className="text-white/50" />
          </div>
        )}
        
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => setCurrentSong(music)}
            className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform"
          >
            <Play size={24} className="ml-0.5" />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(music.id)
          }}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-black/50 text-white hover:bg-red-500'
          }`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-white font-medium text-sm truncate">{music.titulo}</h3>
        <p className="text-gray-400 text-xs truncate">{music.artista}</p>
      </div>
    </div>
  )
}