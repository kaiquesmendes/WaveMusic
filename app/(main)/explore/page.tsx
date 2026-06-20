'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { Compass, Mic2, Disc3, ChevronRight, Music, Play, Search, X } from 'lucide-react'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useSearchParams, useRouter } from 'next/navigation'

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

// Cache de dados (evita requisições duplicadas)
const exploreCache = {
  data: null as any,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000, // 5 minutos
  isValid: () => Date.now() - exploreCache.timestamp < exploreCache.expiryTime
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const isMountedRef = useRef(true)

  // Buscar dados com cache
  const fetchExploreData = useCallback(async () => {
    // Usar cache se válido
    if (exploreCache.isValid() && exploreCache.data) {
      setArtistas(exploreCache.data.artistas)
      setAlbuns(exploreCache.data.albuns)
      setTodasMusicas(exploreCache.data.todasMusicas)
      setFilteredMusicas(exploreCache.data.todasMusicas.slice(0, 20))
      setLoading(false)
      return
    }

    setLoading(true)
    const supabaseAny = supabase as any
    
    try {
      const { data: musicas, error } = await supabaseAny
        .from('musicas')
        .select('*')
        .limit(100)

      if (error) throw error

      if (musicas && musicas.length > 0) {
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
        
        const artistasList = Array.from(artistasMap.values())
        const albunsList = Array.from(albunsMap.values())
        
        // Salvar no cache
        exploreCache.data = {
          artistas: artistasList,
          albuns: albunsList,
          todasMusicas: musicas
        }
        exploreCache.timestamp = Date.now()
        
        if (isMountedRef.current) {
          setArtistas(artistasList)
          setAlbuns(albunsList)
          setTodasMusicas(musicas)
          setFilteredMusicas(musicas.slice(0, 20))
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    isMountedRef.current = true
    fetchExploreData()
    
    return () => {
      isMountedRef.current = false
    }
  }, [fetchExploreData])

  // Processar parâmetros da URL
  useEffect(() => {
    if (artistas.length === 0 || albuns.length === 0) return
    
    const artistaParam = searchParams.get('artista')
    const albumParam = searchParams.get('album')
    const searchParam = searchParams.get('search')
    
    if (artistaParam) {
      const artista = artistas.find(a => a.nome === decodeURIComponent(artistaParam))
      if (artista) {
        setSelectedArtista(artista)
        setSearchMode(true)
        setSearchQuery(artista.nome)
        setFilteredMusicas(artista.musicas)
      }
    } else if (albumParam) {
      const album = albuns.find(a => a.nome === decodeURIComponent(albumParam))
      if (album) {
        setSelectedAlbum(album)
        setSearchMode(true)
        setSearchQuery(album.nome)
        setFilteredMusicas(album.musicas)
      }
    } else if (searchParam) {
      handleSearch(decodeURIComponent(searchParam))
    }
  }, [artistas, albuns, searchParams])

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchMode(false)
      setSelectedArtista(null)
      setSelectedAlbum(null)
      setFilteredMusicas(todasMusicas.slice(0, 20))
      router.push('/explore')
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
    
    if (data) setFilteredMusicas(data)
    router.push(`/explore?search=${encodeURIComponent(query)}`)
  }, [todasMusicas, router])

  const selectArtista = useCallback((artista: Artista) => {
    setSelectedArtista(artista)
    setSelectedAlbum(null)
    setSearchMode(true)
    setSearchQuery(artista.nome)
    setFilteredMusicas(artista.musicas)
    router.push(`/explore?artista=${encodeURIComponent(artista.nome)}`)
  }, [router])

  const selectAlbum = useCallback((album: Album) => {
    setSelectedAlbum(album)
    setSelectedArtista(null)
    setSearchMode(true)
    setSearchQuery(album.nome)
    setFilteredMusicas(album.musicas)
    router.push(`/explore?album=${encodeURIComponent(album.nome)}&artista=${encodeURIComponent(album.artista)}`)
  }, [router])

  const playAlbum = useCallback((album: Album) => {
    if (album.musicas.length > 0) {
      setCurrentSong(album.musicas[0], album.musicas)
    }
  }, [setCurrentSong])

  const backToExplore = useCallback(() => {
    setSearchMode(false)
    setSelectedArtista(null)
    setSelectedAlbum(null)
    setSearchQuery('')
    setFilteredMusicas(todasMusicas.slice(0, 20))
    router.push('/explore')
  }, [todasMusicas, router])

  // Memoizar componentes para evitar re-renders
  const artistasSection = useMemo(() => {
    if (artistas.length === 0) return null
    
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic2 size={22} className="text-purple-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Artistas em Destaque</h2>
          </div>
          <span className="text-xs text-gray-500">{artistas.length} artistas</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {artistas.slice(0, 10).map((artista) => (
            <div
              key={artista.nome}
              onClick={() => selectArtista(artista)}
              className="glass rounded-xl p-4 text-center hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden mb-3 ring-2 ring-white/20 group-hover:ring-purple-500 transition-all">
                <Image
                  src={artista.capa}
                  alt={artista.nome}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors line-clamp-1">
                {artista.nome}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{artista.musicas.length} músicas</p>
            </div>
          ))}
        </div>
      </section>
    )
  }, [artistas, selectArtista])

  const albunsSection = useMemo(() => {
    if (albuns.length === 0) return null
    
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc3 size={22} className="text-pink-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Álbuns em Destaque</h2>
          </div>
          <span className="text-xs text-gray-500">{albuns.length} álbuns</span>
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
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 md:bg-black/50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Play size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-white font-medium truncate group-hover:text-pink-400 transition-colors">
                {album.nome}
              </h3>
              <p className="text-gray-400 text-sm truncate">{album.artista}</p>
              <p className="text-gray-500 text-xs mt-1">{album.musicas.length} músicas</p>
            </div>
          ))}
        </div>
      </section>
    )
  }, [albuns, selectAlbum])

  // Estado de loading
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

  // Visualização de artista
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

        <div className="relative h-64 rounded-2xl overflow-hidden mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all" />
          <div className="relative h-full flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
              <Image
                src={selectedArtista.capa}
                alt={selectedArtista.nome}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Mic2 size={20} className="text-purple-400" />
                <span className="text-sm text-white/80">Artista</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                {selectedArtista.nome}
              </h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                {selectedArtista.generos.slice(0, 3).map((genero, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/10 rounded-full text-xs">
                    {genero}
                  </span>
                ))}
              </div>
              <p className="text-gray-300">
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
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 md:bg-black/50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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

  // Visualização de álbum
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

        <div className="relative h-80 rounded-2xl overflow-hidden mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all" />
          <div className="relative h-full flex flex-col md:flex-row items-center justify-center gap-6 p-6 md:p-8">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
              <Image
                src={selectedAlbum.capa}
                alt={selectedAlbum.nome}
                fill
                className="object-cover"
                priority
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search size={28} className="text-purple-400" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Resultados para "{searchQuery}"
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {filteredMusicas.length} {filteredMusicas.length === 1 ? 'música encontrada' : 'músicas encontradas'}
              </p>
            </div>
          </div>
          <button 
            onClick={backToExplore}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
            Limpar busca
          </button>
        </div>
        
        <MusicGrid musicas={filteredMusicas} />
        
        {filteredMusicas.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Search size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-400">
              Tente buscar por outro artista, música ou álbum
            </p>
          </div>
        )}
      </div>
    )
  }

  // Página principal
  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Compass size={28} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Explorar</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Descubra novos artistas, álbuns e músicas
            </p>
          </div>
        </div>
      </div>

      {artistasSection}
      {albunsSection}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music size={22} className="text-green-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Músicas em Destaque</h2>
          </div>
          <span className="text-xs text-gray-500">Mostrando 20 de {todasMusicas.length}</span>
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