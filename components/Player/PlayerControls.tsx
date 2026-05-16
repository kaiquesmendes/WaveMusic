'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Radio } from 'lucide-react'

export function PlayerControls() {
  const { 
    isPlaying, 
    togglePlay, 
    nextSong, 
    previousSong, 
    isShuffle, 
    toggleShuffle, 
    isRepeat, 
    toggleRepeat,
    isGlobalShuffle,
    toggleGlobalShuffle,
    playRandomSong
  } = usePlayerStore()

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {/* Modo Aleatório Global (Todas as músicas do site) */}
      <button
        onClick={toggleGlobalShuffle}
        className={`p-2 rounded-full transition-all duration-300 ${
          isGlobalShuffle 
            ? 'text-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Modo aleatório global - toca todas as músicas do site"
      >
        <Radio size={18} />
      </button>
      
      {/* Modo Aleatório da Fila */}
      <button
        onClick={toggleShuffle}
        className={`p-2 rounded-full transition-all duration-300 ${
          isShuffle 
            ? 'text-purple-400 bg-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Modo aleatório da playlist"
      >
        <Shuffle size={18} />
      </button>
      
      {/* Anterior */}
      <button
        onClick={previousSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Música anterior"
      >
        <SkipBack size={20} />
      </button>
      
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="bg-white text-black rounded-full p-3 hover:scale-105 transition-all duration-300 shadow-lg"
        title={isPlaying ? 'Pausar' : 'Tocar'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      
      {/* Próxima */}
      <button
        onClick={nextSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Próxima música"
      >
        <SkipForward size={20} />
      </button>
      
      {/* Repetir */}
      <button
        onClick={toggleRepeat}
        className={`p-2 rounded-full transition-all duration-300 ${
          isRepeat 
            ? 'text-purple-400 bg-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="Repetir música"
      >
        <Repeat size={18} />
      </button>
    </div>
  )
}