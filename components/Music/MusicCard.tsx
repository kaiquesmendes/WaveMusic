'use client'

import Image from 'next/image'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useState } from 'react'

interface MusicCardProps {
  music: Musica
  variant?: 'default' | 'compact' | 'featured'
}

export function MusicCard({ music, variant = 'default' }: MusicCardProps) {
  const { setCurrentSong } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isFavorite = favorites.includes(music.id)

  const getImageUrl = () => {
    if (!music.url_capa || imgError) {
      return '/images/default-album.svg'
    }
    return music.url_capa
  }

  // Variante featured (destaque)
  if (variant === 'featured') {
    return (
      <div
        className="relative group rounded-2xl overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square">
          <Image
            src={getImageUrl()}
            alt={music.titulo}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg truncate">{music.titulo}</h3>
          <p className="text-gray-300 text-sm truncate">{music.artista}</p>
        </div>
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => setCurrentSong(music)}
            className="bg-white text-black rounded-full p-4 hover:scale-110 transition-transform shadow-2xl"
          >
            <Play size={28} className="ml-0.5" />
          </button>
        </div>
      </div>
    )
  }

  // Variante compact (para listas)
  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
          <Image
            src={getImageUrl()}
            alt={music.titulo}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{music.titulo}</p>
          <p className="text-gray-400 text-xs truncate">{music.artista}</p>
        </div>
        <button
          onClick={() => toggleFavorite(music.id)}
          className={`p-1.5 rounded-full transition-all ${
            isFavorite 
              ? 'text-red-500 bg-red-500/10' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
          }`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    )
  }

  // Variante default (grid)
  return (
    <div
      className="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        <Image
          src={getImageUrl()}
          alt={music.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgError(true)}
        />
        
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => setCurrentSong(music)}
            className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform shadow-xl"
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
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-black/50 text-white hover:bg-red-500'
          }`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-white font-medium text-sm truncate">{music.titulo}</h3>
        <p className="text-gray-400 text-xs truncate mt-0.5">{music.artista}</p>
      </div>
    </div>
  )
}