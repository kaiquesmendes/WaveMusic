'use client'

import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { Heart, Play } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'
import Image from 'next/image'
import { useState } from 'react'

interface MusicRowProps {
  music: Musica
  index: number
  showImage?: boolean
  showAlbum?: boolean
  // Lista de onde a linha faz parte; vira a fila de reprodução
  queue?: Musica[]
}

export function MusicRow({ music, index, showImage = false, showAlbum = false, queue }: MusicRowProps) {
  const { setCurrentSong } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)
  const isFavorite = favorites.includes(music.id)

  return (
    <div
      className="grid grid-cols-12 gap-4 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors group items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="col-span-1 text-gray-400 text-sm">
        {isHovered ? (
          <button onClick={() => setCurrentSong(music, queue)} className="text-white">
            <Play size={14} />
          </button>
        ) : (
          index
        )}
      </div>
      
      <div className="col-span-5 flex items-center gap-3">
        {showImage && (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            {music.url_capa ? (
              <Image src={music.url_capa} alt={music.titulo} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </div>
        )}
        <span className="text-white font-medium truncate">{music.titulo}</span>
      </div>
      
      {showAlbum && (
        <div className="col-span-3 text-gray-400 text-sm truncate hidden md:block">
          {music.album || '-'}
        </div>
      )}
      
      <div className="col-span-3 text-gray-400 text-sm truncate">
        {music.artista}
      </div>
      
      <div className="col-span-1 flex items-center justify-end gap-2">
        <button
          onClick={() => toggleFavorite(music.id)}
          className={`transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <span className="text-gray-400 text-sm">{formatTime(music.duracao)}</span>
      </div>
    </div>
  )
}