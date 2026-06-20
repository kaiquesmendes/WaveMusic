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
    <div className="relative flex-1 py-2 -my-2">
      <input
        type="range"
        value={safeProgress}
        onChange={handleProgressChange}
        disabled={isLoading}
        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer touch-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white 
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:scale-125 transition-all
          [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
          disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, #fff 0%, #fff ${safeProgress}%, rgba(255,255,255,0.2) ${safeProgress}%, rgba(255,255,255,0.2) 100%)`
        }}
        aria-label="Progresso da música"
      />
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
