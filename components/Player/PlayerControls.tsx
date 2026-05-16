'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat } from 'lucide-react'

export function PlayerControls() {
  const { isPlaying, togglePlay, nextSong, previousSong, isShuffle, toggleShuffle, isRepeat, toggleRepeat } = usePlayerStore()

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={toggleShuffle}
        className={`p-2 rounded-full transition-all duration-300 ${
          isShuffle 
            ? 'text-purple-400 bg-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Modo aleatório"
      >
        <Shuffle size={18} />
      </button>
      
      <button
        onClick={previousSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Anterior"
      >
        <SkipBack size={20} />
      </button>
      
      <button
        onClick={togglePlay}
        className="bg-white text-black rounded-full p-3 hover:scale-105 transition-all duration-300 shadow-lg"
        title={isPlaying ? 'Pausar' : 'Tocar'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      
      <button
        onClick={nextSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Próxima"
      >
        <SkipForward size={20} />
      </button>
      
      <button
        onClick={toggleRepeat}
        className={`p-2 rounded-full transition-all duration-300 ${
          isRepeat 
            ? 'text-purple-400 bg-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Repetir"
      >
        <Repeat size={18} />
      </button>
    </div>
  )
}