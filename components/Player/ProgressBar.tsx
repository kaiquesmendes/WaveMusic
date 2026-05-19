'use client'

import { usePlayerStore } from '@/store/playerStore'

export function ProgressBar() {
  const { progress, seekTo, duration, isLoading } = usePlayerStore()

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value)
    if (!isNaN(newProgress) && duration > 0) {
      seekTo((newProgress / 100) * duration)
    }
  }

  const safeProgress = isNaN(progress) ? 0 : progress

  return (
    <div className="relative flex-1">
      <input
        type="range"
        value={safeProgress}
        onChange={handleProgressChange}
        disabled={isLoading}
        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:scale-125 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}