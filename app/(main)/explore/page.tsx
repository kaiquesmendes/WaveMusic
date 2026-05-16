'use client'

import { useState, useEffect } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { SearchBar } from '@/components/Search/SearchBar'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { Compass, Mic2, Disc3, ChevronRight, Music, Play } from 'lucide-react'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'

interface Artista {
  nome: string
  musicas: Musica[]
  capa: string
  generos: string[]
}

interface Album {
  id: string
  nome: string
  artista: string
  capa: string
  musicas: Musica[]
  ano: string
}

export default function ExplorePage() {
  const [artistas, setArtistas] = useState<Artista[]>([])
  const [albuns, setAlbuns] = useState<Album[]>([])
  const [todasMusicas, setTodasMusicas] = useState<Musica[]>([])
  const [filteredMusicas, setFilteredMusicas] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArtista, setSelectedArtista] = useState<Artista | null>(null)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const { setCurrentSong } = usePlayerStore()

  useEffect(() => {
    fetchExploreData()
  }, [])

  async function fetchExploreData() {
    setLoading(true)
    
    const supabaseAny = supabase as any
    
    const { data: musicas } = await supabaseAny
      .from('musicas')
      .select('*')
      .limit(100)

    if (musicas && musicas.length > 0) {
      setTodasMusicas(musicas)
      setFilteredMusicas(musicas.slice(0, 20))
      
      const artistasMap = new Map<string, Artista>()
      const albunsMap = new Map<string, Album>()
      
      musicas.forEach((musica: Musica) => {
        // Processar artista
        if (!artistasMap.has(musica.artista)) {
          artistasMap.set(musica.artista, {
            nome: musica.artista,
            musicas: [],
            capa: musica.url_capa || '/images/default-album.svg',
            generos: []
          })
        }
        const artista = artistasMap.get(musica.artista)!
        artista.musicas.push(musica)
        
        if (musica.genero) {
          const generosList = musica.genero.split(',').map(g => g.trim())
          generosList.forEach(genero => {
            if (!artista.generos.includes(genero)) {
              artista.generos.push(genero)
            }
          })
        }
        
        // Processar álbum
        if (musica.album) {
          const albumKey = `${musica.artista}-${musica.album}`
          if (!albunsMap.has(albumKey)) {
            albunsMap.set(albumKey, {
              id: albumKey,
              nome: musica.album,
              artista: musica.artista,
              capa: musica.url_capa || '/images/default-album.svg',
              musicas: [],
              ano: new Date(musica.created_at).getFullYear().toString()
            })
          }
          const album = albunsMap.get(albumKey)!
          if (!album.musicas.some(m => m.id === musica.id)) {
            album.musicas.push(musica)
          }
        }
      })
      
      setArtistas(Array.from(artistasMap.values()))
      setAlbuns(Array.from(albunsMap.values()))
    }
    
    setLoading(false)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchMode(false)
      setSelectedArtista(null)
      setSelectedAlbum(null)
      setFilteredMusicas(todasMusicas.slice(0, 20))
      return
    }
    
    setSearchMode(true)
    setSelectedArtista(null)
    setSelectedAlbum(null)
    
    const supabaseAny = supabase as any
    const { data } = await supabaseAny
      .from('musicas')
      .select('*')
      .or(`titulo.ilike.%${query}%,artista.ilike.%${query}%,genero.ilike.%${query}%,album.ilike.%${query}%`)
      .limit(50)
    
    if (data) {
      setFilteredMusicas(data)
    }
  }

  const selectArtista = (artista: Artista) => {
    setSelectedArtista(artista)
    setSelectedAlbum(null)
    setSearchMode(true)
    setSearchQuery(artista.nome)
    setFilteredMusicas(artista.musicas)
  }

  const selectAlbum = (album: Album) => {
    setSelectedAlbum(album)
    setSelectedArtista(null)
    setSearchMode(true)
    setSearchQuery(album.nome)
    setFilteredMusicas(album.musicas)
  }

  const playAlbum = (album: Album) => {
    if (album.musicas.length > 0) {
      setCurrentSong(album.musicas[0], album.musicas)
    }
  }

  const backToExplore = () => {
    setSearchMode(false)
    setSelectedArtista(null)
    setSelectedAlbum(null)
    setSearchQuery('')
    setFilteredMusicas(todasMusicas.slice(0, 20))
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-white/10 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl h-48" />
          ))}
        </div>
      </div>
    )
  }

  // Se está visualizando um artista específico
  if (selectedArtista) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <button 
          onClick={backToExplore}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
        >
          <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          Voltar para Explorar
        </button>

        <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center gap-6 p-8">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={selectedArtista.capa}
                alt={selectedArtista.nome}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mic2 size={20} className="text-purple-400" />
                <span className="text-sm text-white/80">Artista</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {selectedArtista.nome}
              </h1>
              <div className="flex gap-2">
                {selectedArtista.generos.slice(0, 3).map((genero, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/10 rounded-full text-xs">
                    {genero}
                  </span>
                ))}
              </div>
              <p className="text-gray-300 mt-3">
                {selectedArtista.musicas.length} músicas
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Music size={22} />
            Todas as Músicas
          </h2>
          <MusicGrid musicas={selectedArtista.musicas} />
        </section>

        {albuns.filter(a => a.artista === selectedArtista.nome).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Disc3 size={22} />
              Álbuns
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {albuns
                .filter(a => a.artista === selectedArtista.nome)
                .map((album) => (
                  <div 
                    key={album.id} 
                    onClick={() => selectAlbum(album)}
                    className="glass rounded-xl p-4 hover:scale-105 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                      <Image
                        src={album.capa}
                        alt={album.nome}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={24} className="text-white" />
                      </div>
                    </div>
                    <h3 className="text-white font-medium truncate">{album.nome}</h3>
                    <p className="text-gray-400 text-sm">{album.ano}</p>
                    <p className="text-gray-500 text-xs">{album.musicas.length} músicas</p>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // Se está visualizando um álbum específico
  if (selectedAlbum) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <button 
          onClick={backToExplore}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
        >
          <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          Voltar para Explorar
        </button>

        <div className="relative h-80 rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex flex-col md:flex-row items-center justify-center gap-8 p-8">
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={selectedAlbum.capa}
                alt={selectedAlbum.nome}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Disc3 size={20} className="text-purple-400" />
                <span className="text-sm text-white/80">Álbum</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {selectedAlbum.nome}
              </h1>
              <p className="text-white/80 text-lg mb-2">{selectedAlbum.artista}</p>
              <p className="text-gray-400 mb-4">{selectedAlbum.ano} • {selectedAlbum.musicas.length} músicas</p>
              <button
                onClick={() => playAlbum(selectedAlbum)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 mx-auto md:mx-0"
              >
                <Play size={18} fill="white" />
                Reproduzir Álbum
              </button>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Music size={22} />
            Músicas do Álbum
          </h2>
          <MusicGrid musicas={selectedAlbum.musicas} />
        </section>
      </div>
    )
  }

  // Modo de busca
  if (searchMode) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={28} className="text-purple-400" />
            <h1 className="text-3xl font-bold text-white">
              Resultados para "{searchQuery}"
            </h1>
          </div>
          <button 
            onClick={backToExplore}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Limpar
          </button>
        </div>
        
        <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
        
        <div className="text-sm text-gray-400 mb-4">
          {filteredMusicas.length} músicas encontradas
        </div>
        
        <MusicGrid musicas={filteredMusicas} />
      </div>
    )
  }

  // Página principal do Explorar
  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Compass size={32} className="text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Explorar</h1>
            <p className="text-gray-400 text-sm mt-1">
              Descubra novos artistas, álbuns e músicas
            </p>
          </div>
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Artistas em Destaque */}
      {artistas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mic2 size={22} className="text-purple-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Artistas em Destaque</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {artistas.slice(0, 10).map((artista) => (
              <div
                key={artista.nome}
                onClick={() => selectArtista(artista)}
                className="glass rounded-xl p-4 text-center hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden mb-3">
                  <Image
                    src={artista.capa}
                    alt={artista.nome}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-white font-medium">{artista.nome}</h3>
                <p className="text-gray-400 text-sm">{artista.musicas.length} músicas</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Álbuns em Destaque */}
      {albuns.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Disc3 size={22} className="text-pink-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Álbuns em Destaque</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {albuns.slice(0, 10).map((album) => (
              <div 
                key={album.id} 
                onClick={() => selectAlbum(album)}
                className="glass rounded-xl p-4 hover:scale-105 transition-all cursor-pointer group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <Image
                    src={album.capa}
                    alt={album.nome}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-white font-medium truncate">{album.nome}</h3>
                <p className="text-gray-400 text-sm truncate">{album.artista}</p>
                <p className="text-gray-500 text-xs">{album.musicas.length} músicas</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Músicas em Destaque */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Music size={22} className="text-green-400" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Músicas em Destaque</h2>
        </div>
        <MusicGrid musicas={todasMusicas.slice(0, 20)} />
        
        {todasMusicas.length > 20 && (
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Mostrando 20 de {todasMusicas.length} músicas. Use a busca para encontrar mais!
            </p>
          </div>
        )}
      </section>
    </div>
  )
}