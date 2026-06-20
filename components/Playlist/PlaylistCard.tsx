'use client'

import Link from 'next/link'
import { Playlist } from '@/types'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface PlaylistCardProps {
  playlist: Playlist
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/playlist/${playlist.id}`}>
      <div className="group relative bg-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-[0.98] cursor-pointer">
        <div className="relative aspect-square">
          {playlist.url_capa ? (
            <Image
              src={playlist.url_capa}
              alt={playlist.nome}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/30 md:bg-black/50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform shadow-xl">
              <Play size={24} className="ml-0.5" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-medium truncate">{playlist.nome}</h3>
          {playlist.descricao && (
            <p className="text-gray-400 text-sm truncate">{playlist.descricao}</p>
          )}
        </div>
      </div>
    </Link>
  )
}