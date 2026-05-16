'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react'

export function PlayerControls() {
  const { isPlaying, togglePlay, nextSong, previousSong } = usePlayerStore()

  return (
    <div className="flex items-center justify-center gap-6">
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
  )
}