'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, Radio } from 'lucide-react'

export function PlayerControls() {
  const {
    isPlaying,
    togglePlay,
    nextSong,
    previousSong,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    isGlobalShuffle,
    toggleGlobalShuffle
  } = usePlayerStore()

  const active = 'text-purple-400 bg-purple-500/20'
  const inactive = 'text-gray-400 hover:text-white hover:bg-white/10'

  const repeatTitle =
    repeatMode === 'off' ? 'Repetir fila' : repeatMode === 'all' ? 'Repetindo a fila — clique para repetir a música' : 'Repetindo a música — clique para desativar'

  return (
    <div className="flex items-center justify-center gap-1 md:gap-3">
      {/* Rádio: toda a biblioteca no aleatório */}
      <button
        onClick={() => toggleGlobalShuffle()}
        className={`p-2 rounded-full transition-all duration-300 ${isGlobalShuffle ? `${active} shadow-lg shadow-purple-500/20` : inactive}`}
        title={isGlobalShuffle ? 'Desativar rádio' : 'Rádio — tocar todas as músicas no aleatório'}
        aria-label="Rádio (todas as músicas no aleatório)"
        aria-pressed={isGlobalShuffle}
      >
        <Radio size={18} />
      </button>

      {/* Aleatório da fila atual */}
      <button
        onClick={toggleShuffle}
        className={`p-2 rounded-full transition-all duration-300 ${isShuffle ? active : inactive}`}
        title={isShuffle ? 'Desativar aleatório' : 'Ativar aleatório'}
        aria-label="Aleatório"
        aria-pressed={isShuffle}
      >
        <Shuffle size={18} />
      </button>

      <button
        onClick={previousSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Anterior"
        aria-label="Anterior"
      >
        <SkipBack size={20} />
      </button>

      <button
        onClick={togglePlay}
        className="bg-white text-black rounded-full p-3 hover:scale-105 transition-all duration-300 shadow-lg"
        title={isPlaying ? 'Pausar' : 'Tocar'}
        aria-label={isPlaying ? 'Pausar' : 'Tocar'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>

      <button
        onClick={nextSong}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title="Próxima"
        aria-label="Próxima"
      >
        <SkipForward size={20} />
      </button>

      {/* Repetir: desligado -> fila -> música */}
      <button
        onClick={toggleRepeat}
        className={`p-2 rounded-full transition-all duration-300 ${repeatMode !== 'off' ? active : inactive}`}
        title={repeatTitle}
        aria-label="Repetir"
        aria-pressed={repeatMode !== 'off'}
      >
        {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
      </button>
    </div>
  )
}
