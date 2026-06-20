'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function VolumeControl() {
  const { volume, setVolume } = usePlayerStore()
  const [previousVolume, setPreviousVolume] = useState(70)
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const showSlider = isHovered || isExpanded

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />
    if (volume < 30) return <Volume1 size={20} />
    if (volume < 70) return <Volume size={20} />
    return <Volume2 size={20} />
  }

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(previousVolume)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
    }
  }

  const getSliderGradient = () => {
    const percentage = (volume / 100) * 100
    return `linear-gradient(to right, #a855f7 0%, #a855f7 ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`
  }

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.background = getSliderGradient()
    }
  }, [volume])

  // Fecha o slider expandido (mobile) ao tocar fora dele
  useEffect(() => {
    if (!isExpanded) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isExpanded])

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => {
          // No touch (sem hover), o primeiro toque só revela o slider;
          // toques seguintes alternam mudo. Em desktop, sempre alterna mudo.
          if (!isHovered && !isExpanded) {
            setIsExpanded(true)
            return
          }
          toggleMute()
        }}
        className="p-2 -m-0.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
        title={volume === 0 ? 'Ativar som' : 'Mutar'}
        aria-label={volume === 0 ? 'Ativar som' : 'Mutar'}
      >
        {getVolumeIcon()}
      </button>

      {/* Slider horizontal com animação */}
      <div className={`overflow-hidden transition-all duration-300 ${
        showSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'
      }`}>
        <input
          ref={sliderRef}
          type="range"
          value={volume}
          onChange={(e) => {
            const newVolume = Number(e.target.value)
            setVolume(newVolume)
            if (newVolume > 0 && previousVolume === 0) {
              setPreviousVolume(newVolume)
            }
          }}
          min="0"
          max="100"
          step="1"
          className="w-24 h-2 rounded-full appearance-none cursor-pointer touch-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
          style={{ background: getSliderGradient() }}
          aria-label="Volume"
        />
      </div>

      {/* Indicador percentual */}
      {showSlider && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass-dark rounded-full px-2 py-1 text-xs font-medium text-purple-400 whitespace-nowrap animate-fade-in pointer-events-none">
          {Math.round(volume)}%
        </div>
      )}
    </div>
  )
}
