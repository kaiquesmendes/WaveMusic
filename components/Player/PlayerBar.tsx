'use client'

import { usePlayerStore } from '@/store/playerStore'
import { PlayerControls } from './PlayerControls'
import { VolumeControl } from './VolumeControl'
import { ProgressBar } from './ProgressBar'
import { formatTime } from '@/lib/utils/formatTime'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/lib/hooks/useFavorites'

export function PlayerBar() {
  const { currentSong, duration, currentTime } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()

  if (!currentSong) {
    return (
      <div className="flex-shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 py-3">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          🎵 Selecione uma música para começar
        </div>
      </div>
    )
  }

  const isFavorite = favorites.includes(currentSong.id)

  return (
    <div className="flex-shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            {currentSong.url_capa ? (
              <Image
                src={currentSong.url_capa}
                alt={currentSong.titulo}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{currentSong.titulo}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong.artista}</p>
          </div>
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className={`p-1 rounded-full transition-colors flex-shrink-0 ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-center mb-1">
            <PlayerControls />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <ProgressBar />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="min-w-[100px] flex justify-end">
          <VolumeControl />
        </div>
      </div>
    </div>
  )
}