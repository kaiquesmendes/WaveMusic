'use client'

import { usePlayerStore } from '@/store/playerStore'
import { PlayerControls } from './PlayerControls'
import { VolumeControl } from './VolumeControl'
import { ProgressBar } from './ProgressBar'
import { formatTime } from '@/lib/utils/formatTime'
import Image from 'next/image'
import { Heart, SkipForward, SkipBack, Play, Pause, Radio, Loader2 } from 'lucide-react'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export function PlayerBar() {
  const { 
    currentSong, 
    duration, 
    currentTime, 
    isPlaying, 
    nextSong, 
    previousSong,
    togglePlay,
    isGlobalShuffle,
    toggleGlobalShuffle,
    playRandomSong,
    error
  } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const { user } = useAuth()
  const hasSavedRef = useRef<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const [isBuffering, setIsBuffering] = useState(false)
  const isMountedRef = useRef(true)

  // SALVAR NO HISTÓRICO - Otimizado
  const saveToHistory = useCallback(async () => {
    if (!currentSong || !user || !isPlaying) return
    if (hasSavedRef.current === currentSong.id) return
    
    try {
      const supabaseAny = supabase as any
      const { error } = await supabaseAny
        .from('historico')
        .insert({
          usuario_id: user.id,
          musica_id: currentSong.id,
          played_at: new Date().toISOString()
        })
      
      if (!error) {
        hasSavedRef.current = currentSong.id
      }
    } catch (error) {
      console.error('Erro ao salvar no histórico:', error)
    }
  }, [currentSong, user, isPlaying])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (!currentSong || !user || !isPlaying) return
    if (hasSavedRef.current === currentSong.id) return
    
    saveTimeoutRef.current = setTimeout(saveToHistory, 10000)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [currentSong, isPlaying, user, saveToHistory])

  useEffect(() => {
    hasSavedRef.current = ''
    setIsBuffering(false)
  }, [currentSong?.id])

  // Media Session API - Combinado em um único efeito
  useEffect(() => {
    if (!currentSong) return

    const updateMediaSession = () => {
      if (!('mediaSession' in navigator)) return
      
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.titulo,
          artist: currentSong.artista,
          album: currentSong.album || 'WaveMusic',
          artwork: [
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '96x96', type: 'image/jpeg' },
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '128x128', type: 'image/jpeg' },
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '192x192', type: 'image/jpeg' },
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '256x256', type: 'image/jpeg' },
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '384x384', type: 'image/jpeg' },
            { src: currentSong.url_capa || '/images/default-album.svg', sizes: '512x512', type: 'image/jpeg' }
          ]
        })

        navigator.mediaSession.setActionHandler('play', () => togglePlay())
        navigator.mediaSession.setActionHandler('pause', () => togglePlay())
        navigator.mediaSession.setActionHandler('previoustrack', () => previousSong())
        navigator.mediaSession.setActionHandler('nexttrack', () => nextSong())
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
        
        if (duration > 0) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            position: currentTime,
            playbackRate: 1
          })
        }
      } catch (error) {}
    }

    updateMediaSession()

    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null)
          navigator.mediaSession.setActionHandler('pause', null)
          navigator.mediaSession.setActionHandler('previoustrack', null)
          navigator.mediaSession.setActionHandler('nexttrack', null)
        } catch (error) {}
      }
    }
  }, [currentSong, isPlaying, currentTime, duration, togglePlay, previousSong, nextSong])

  // Simular buffering (quando a música está carregando)
  useEffect(() => {
    if (!currentSong) return
    
    // Simular loading da música (Howl.js tem evento onload, mas é complexo)
    const timer = setTimeout(() => setIsBuffering(false), 500)
    setIsBuffering(true)
    
    return () => clearTimeout(timer)
  }, [currentSong?.id])

  const handleGlobalShuffle = useCallback(async () => {
    if (!isGlobalShuffle) {
      await toggleGlobalShuffle()
      await playRandomSong()
    } else {
      toggleGlobalShuffle()
    }
  }, [isGlobalShuffle, toggleGlobalShuffle, playRandomSong])

  const handleToggleFavorite = useCallback(() => {
    if (currentSong) toggleFavorite(currentSong.id)
  }, [currentSong, toggleFavorite])

  // Memoizar valores calculados
  const isFavorite = useMemo(() => 
    currentSong ? favorites.includes(currentSong.id) : false
  , [favorites, currentSong])

  const songInfo = useMemo(() => {
    if (!currentSong) return null
    return {
      title: currentSong.titulo,
      artist: currentSong.artista,
      cover: currentSong.url_capa
    }
  }, [currentSong])

  if (!currentSong || !songInfo) {
    return (
      <div className="flex-shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 py-3">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          🎵 Selecione uma música para começar
        </div>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 bg-black/80 backdrop-blur-xl border-t border-white/10 py-3 px-4 relative">
      {error && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-xl shadow-lg animate-slide-up max-w-[90vw] text-center">
          {error}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar superior */}
        <div className="w-full mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <ProgressBar />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles principais */}
        <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              {songInfo.cover ? (
                <Image
                  src={songInfo.cover}
                  alt={songInfo.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
              )}
              {isBuffering && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{songInfo.title}</p>
              <p className="text-xs text-gray-400 truncate">{songInfo.artist}</p>
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                isFavorite 
                  ? 'text-red-500 bg-red-500/10 scale-105' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
              }`}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Controles Centrais */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {/* Modo Aleatório Global */}
            <button
              onClick={handleGlobalShuffle}
              className={`p-2 rounded-full transition-all duration-300 ${
                isGlobalShuffle 
                  ? 'text-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isGlobalShuffle ? 'Desativar modo aleatório' : 'Ativar modo aleatório - tocar todas as músicas'}
              aria-label="Modo aleatório global"
            >
              <Radio size={18} />
            </button>

            {/* Anterior */}
            <button
              onClick={previousSong}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
              title="Música anterior"
              aria-label="Anterior"
            >
              <SkipBack size={20} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-3 hover:scale-105 transition-all duration-300 shadow-lg"
              title={isPlaying ? 'Pausar' : 'Tocar'}
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            {/* Próxima */}
            <button
              onClick={nextSong}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
              title="Próxima música"
              aria-label="Próxima"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Volume */}
          <div className="min-w-[100px] flex justify-end">
            <VolumeControl />
          </div>
        </div>
      </div>
    </div>
  )
}

// Adicionar useState
import { useState } from 'react'