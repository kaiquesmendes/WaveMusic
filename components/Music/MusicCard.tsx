'use client'

import Image from 'next/image'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useState } from 'react'

interface MusicCardProps {
  music: Musica
  variant?: 'default' | 'compact' | 'featured'
  // Lista de onde o card faz parte (seção, playlist, álbum...). É ela que vira a fila de reprodução.
  queue?: Musica[]
}

export function MusicCard({ music, variant = 'default', queue }: MusicCardProps) {
  const { setCurrentSong, currentSong, isPlaying } = usePlayerStore()
  const { favorites, toggleFavorite } = useFavorites()
  const [imgError, setImgError] = useState(false)
  const isFavorite = favorites.includes(music.id)
  const isCurrent = currentSong?.id === music.id

  const getImageUrl = () => {
    if (!music.url_capa || imgError) {
      return '/images/default-album.svg'
    }
    return music.url_capa
  }

  // Variante featured (destaque)
  if (variant === 'featured') {
    return (
      <div className="relative group rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
        <div className="relative aspect-square">
          <Image
            src={getImageUrl()}
            alt={music.titulo}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg truncate">{music.titulo}</h3>
          <p className="text-gray-300 text-sm truncate">{music.artista}</p>
        </div>
        {/* Botão de play: sempre visível no mobile (sem hover), só revela no hover em telas md+ */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setCurrentSong(music, queue)}
            className="bg-white text-black rounded-full p-4 hover:scale-110 active:scale-95 transition-transform shadow-2xl"
            aria-label={`Tocar ${music.titulo}`}
          >
            <Play size={28} className="ml-0.5" />
          </button>
        </div>
      </div>
    )
  }

  // Variante compact (para listas)
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 p-2 rounded-xl active:bg-white/10 hover:bg-white/5 transition-all cursor-pointer group ${
          isCurrent ? 'bg-purple-500/10' : ''
        }`}
        onClick={() => setCurrentSong(music, queue)}
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
          <Image
            src={getImageUrl()}
            alt={music.titulo}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
          {isCurrent && isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-3">
                <span className="w-0.5 bg-purple-400 animate-pulse" style={{ height: '60%' }} />
                <span className="w-0.5 bg-purple-400 animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                <span className="w-0.5 bg-purple-400 animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{music.titulo}</p>
          <p className="text-gray-400 text-xs truncate">{music.artista}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(music.id)
          }}
          className={`p-2 -m-0.5 rounded-full transition-all ${
            isFavorite 
              ? 'text-red-500 bg-red-500/10' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
          }`}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    )
  }

  // Variante default (grid)
  return (
    <div
      className="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.03] active:scale-[0.98] hover:shadow-2xl cursor-pointer"
      onClick={() => setCurrentSong(music, queue)}
    >
      <div className="relative aspect-square">
        <Image
          src={getImageUrl()}
          alt={music.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgError(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />

        {/* Botão de play: sempre visível no mobile, revela no hover em desktop */}
        <div className="absolute inset-0 bg-black/30 md:bg-black/50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSong(music, queue)
            }}
            className="bg-white text-black rounded-full p-3 hover:scale-110 active:scale-95 transition-transform shadow-xl"
            aria-label={`Tocar ${music.titulo}`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex gap-0.5 items-end h-4 w-4 justify-center">
                <span className="w-1 bg-black animate-pulse" style={{ height: '60%' }} />
                <span className="w-1 bg-black animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                <span className="w-1 bg-black animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
              </div>
            ) : (
              <Play size={24} className="ml-0.5" />
            )}
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(music.id)
          }}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isFavorite
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-black/50 text-white hover:bg-red-500'
          }`}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-3">
        <h3 className={`font-medium text-sm truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{music.titulo}</h3>
        <p className="text-gray-400 text-xs truncate mt-0.5">{music.artista}</p>
      </div>
    </div>
  )
}