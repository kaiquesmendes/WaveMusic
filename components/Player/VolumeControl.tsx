'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Volume2, VolumeX } from 'lucide-react'

export function VolumeControl() {
  const { volume, setVolume } = usePlayerStore()

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setVolume(volume === 0 ? 70 : 0)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <input
        type="range"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        min="0"
        max="100"
        className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
          [&::-webkit-slider-thumb]:rounded-full"
      />
    </div>
  )
}