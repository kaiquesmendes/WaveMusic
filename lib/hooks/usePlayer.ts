'use client'

import { usePlayerStore } from '@/store/playerStore'

export function usePlayer() {
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
    previousSong,
    setCurrentSong,
  } = usePlayerStore()

  return {
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
    previousSong,
    setCurrentSong,
  }
}