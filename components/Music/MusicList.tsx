'use client'

import { Musica } from '@/types'
import { MusicRow } from './MusicRow'

interface MusicListProps {
  musicas: Musica[]
  showImage?: boolean
  showAlbum?: boolean
}

export function MusicList({ musicas, showImage = false, showAlbum = false }: MusicListProps) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 border-b border-white/10">
        <div className="col-span-1">#</div>
        <div className="col-span-5">Título</div>
        {showAlbum && <div className="col-span-3 hidden md:block">Álbum</div>}
        <div className="col-span-3">Artista</div>
        <div className="col-span-1 text-right">⏱️</div>
      </div>
      
      {musicas.map((musica, index) => (
        <MusicRow
          key={musica.id}
          music={musica}
          queue={musicas}
          index={index + 1}
          showImage={showImage}
          showAlbum={showAlbum}
        />
      ))}
    </div>
  )
}