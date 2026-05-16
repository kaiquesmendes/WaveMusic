// components/MusicCard.tsx
'use client'

import Image from 'next/image'
import { Play, Heart } from 'lucide-react'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useState } from 'react'

interface MusicCardProps {
  music: Musica
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function MusicCard({ music, isFavorite, onToggleFavorite }: MusicCardProps) {
  const { setCurrentSong } = usePlayerStore()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        {music.url_capa && (
          <Image
            src={music.url_capa}
            alt={music.titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        )}
        
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => setCurrentSong(music)}
            className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform"
          >
            <Play size={24} />
          </button>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-black/50 text-white hover:bg-red-500'
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-white font-medium truncate">{music.titulo}</h3>
        <p className="text-gray-400 text-sm truncate">{music.artista}</p>
      </div>
    </div>
  )
}