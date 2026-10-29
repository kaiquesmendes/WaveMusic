'use client'

import { usePlayerStore } from '@/store/playerStore'
import { PlayerControls } from './PlayerControls'
import { VolumeControl } from './VolumeControl'
import { ProgressBar } from './ProgressBar'
import { formatTime } from '@/lib/utils/formatTime'
import Image from 'next/image'
import { Heart, Loader2 } from 'lucide-react'
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
    isLoading,
    error
  } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const { user } = useAuth()
  const hasSavedRef = useRef<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

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
  }, [currentSong?.id])

  // Media Session API (tela de bloqueio / teclas de mídia).
  // Os handlers chamam a store direto via getState(), então não dependem de
  // currentTime e não precisam ser recriados a cada atualização de progresso.
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return

    const cover = currentSong.url_capa || '/images/default-album.svg'
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.titulo,
        artist: currentSong.artista,
        album: currentSong.album || 'WaveMusic',
        artwork: ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'].map(sizes => ({
          src: cover,
          sizes,
          type: 'image/jpeg'
        }))
      })

      const player = () => usePlayerStore.getState()
      navigator.mediaSession.setActionHandler('play', () => player().togglePlay())
      navigator.mediaSession.setActionHandler('pause', () => player().togglePlay())
      navigator.mediaSession.setActionHandler('previoustrack', () => player().previousSong())
      navigator.mediaSession.setActionHandler('nexttrack', () => player().nextSong())
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') player().seekTo(details.seekTime)
      })
    } catch (error) {}

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('previoustrack', null)
        navigator.mediaSession.setActionHandler('nexttrack', null)
        navigator.mediaSession.setActionHandler('seekto', null)
      } catch (error) {}
    }
  }, [currentSong])

  // Estado de reprodução e posição: só quando muda play/pause ou a duração
  // (o navegador extrapola a posição sozinho a partir daí)
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration,
          position: Math.min(usePlayerStore.getState().currentTime, duration),
          playbackRate: 1
        })
      }
    } catch (error) {}
  }, [currentSong, isPlaying, duration])

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
              {isLoading && (
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

          {/* Controles Centrais: rádio, aleatório, anterior, play/pause, próxima, repetir */}
          <PlayerControls />

          {/* Volume */}
          <div className="min-w-[100px] flex justify-end">
            <VolumeControl />
          </div>
        </div>
      </div>
    </div>
  )
}