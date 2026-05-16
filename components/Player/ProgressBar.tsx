'use client'

import { usePlayerStore } from '@/store/playerStore'

export function ProgressBar() {
  const { progress, seekTo, duration } = usePlayerStore()

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value)
    if (!isNaN(newProgress) && duration > 0) {
      seekTo((newProgress / 100) * duration)
    }
  }

  // Garantir que progress é um número válido
  const safeProgress = isNaN(progress) ? 0 : progress

  return (
    <input
      type="range"
      value={safeProgress}
      onChange={handleProgressChange}
      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
        [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
        hover:h-1.5 transition-all"
    />
  )
}