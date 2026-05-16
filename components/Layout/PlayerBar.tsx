// components/Player/PlayerBar.tsx
'use client'

import { usePlayerStore } from '@/store/playerStore'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX 
} from 'lucide-react'
import { formatTime } from '@/utils/formatTime'
import Image from 'next/image'

export function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    duration,
    currentTime,
    togglePlay,
    setVolume,
    seekTo,
    nextSong,
    previousSong
  } = usePlayerStore()

  if (!currentSong) return null

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value)
    seekTo((newProgress / 100) * duration)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center gap-3 w-64">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
            {currentSong.url_capa && (
              <Image
                src={currentSong.url_capa}
                alt={currentSong.titulo}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{currentSong.titulo}</p>
            <p className="text-xs text-gray-400">{currentSong.artista}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-center gap-6 mb-2">
            <button
              onClick={previousSong}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={nextSong}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <input
              type="range"
              value={progress}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 w-64 justify-end">
          <button
            onClick={() => setVolume(volume === 0 ? 70 : 0)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            value={volume}
            onChange={handleVolumeChange}
            min="0"
            max="100"
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
              [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
              [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </div>
  )
}