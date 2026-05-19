'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Loader2, Play, Mic2, Disc3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch?: (query: string) => void
  initialValue?: string
  onResultClick?: (music: Musica) => void
}

interface ArtistaResult {
  artista: string
  url_capa: string | null
}

interface AlbumResult {
  album: string
  artista: string
  url_capa: string | null
}

// Cache de resultados de busca (opcional, para melhor performance)
const searchCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 segundos

export function SearchBar({ onSearch, initialValue = '', onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<Musica[]>([])
  const [artistasResults, setArtistasResults] = useState<ArtistaResult[]>([])
  const [albunsResults, setAlbunsResults] = useState<AlbumResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)
  const { setCurrentSong } = usePlayerStore()
  const router = useRouter()

  // Limpar cache quando o componente desmontar (opcional)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  // Click outside handler - memoizado
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Função de busca principal - memoizada
  const searchAll = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setArtistasResults([])
      setAlbunsResults([])
      return
    }

    // Verificar cache
    const cached = searchCache.get(searchQuery)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setResults(cached.data.results)
      setArtistasResults(cached.data.artistasResults)
      setAlbunsResults(cached.data.albunsResults)
      setIsOpen(true)
      setLoading(false)
      return
    }

    setLoading(true)
    const supabaseAny = supabase as any
    
    try {
      // Executar queries em paralelo para melhor performance
      const [musicasPromise, artistasPromise, albunsPromise] = await Promise.allSettled([
        supabaseAny
          .from('musicas')
          .select('*')
          .or(`titulo.ilike.%${searchQuery}%,artista.ilike.%${searchQuery}%,genero.ilike.%${searchQuery}%,album.ilike.%${searchQuery}%`)
          .limit(5),
        supabaseAny
          .from('musicas')
          .select('artista, url_capa')
          .ilike('artista', `%${searchQuery}%`)
          .limit(5),
        supabaseAny
          .from('musicas')
          .select('album, artista, url_capa')
          .not('album', 'is', null)
          .ilike('album', `%${searchQuery}%`)
          .limit(5)
      ])

      let musicasData = null
      let artistasData = null
      let albunsData = null

      if (musicasPromise.status === 'fulfilled') musicasData = musicasPromise.value.data
      if (artistasPromise.status === 'fulfilled') artistasData = artistasPromise.value.data
      if (albunsPromise.status === 'fulfilled') albunsData = albunsPromise.value.data

      // Processar resultados
      let resultsList: Musica[] = []
      let artistasList: ArtistaResult[] = []
      let albunsList: AlbumResult[] = []

      if (musicasData) resultsList = musicasData
      
      if (artistasData) {
        const uniqueArtistas = Array.from(
          new Map(artistasData.map((a: ArtistaResult) => [a.artista, a])).values()
        )
        artistasList = uniqueArtistas.slice(0, 3)
      }
      
      if (albunsData) {
        const uniqueAlbuns = Array.from(
          new Map(albunsData.map((a: AlbumResult) => [a.album, a])).values()
        )
        albunsList = uniqueAlbuns.slice(0, 3)
      }

      // Salvar no cache
      searchCache.set(searchQuery, {
        data: { results: resultsList, artistasResults: artistasList, albunsResults: albunsList },
        timestamp: Date.now()
      })

      if (isMountedRef.current) {
        setResults(resultsList)
        setArtistasResults(artistasList)
        setAlbunsResults(albunsList)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  // Debounce da busca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      searchAll(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchAll])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) onSearch(value)
  }, [onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setArtistasResults([])
    setAlbunsResults([])
    setIsOpen(false)
    if (onSearch) onSearch('')
  }, [onSearch])

  const handleMusicClick = useCallback((music: Musica) => {
    setCurrentSong(music)
    setIsOpen(false)
    setQuery('')
    if (onResultClick) onResultClick(music)
  }, [setCurrentSong, onResultClick])

  const handleArtistaClick = useCallback((artista: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/explore?artista=${encodeURIComponent(artista)}`)
  }, [router])

  const handleAlbumClick = useCallback((album: string, artista: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/explore?album=${encodeURIComponent(album)}&artista=${encodeURIComponent(artista)}`)
  }, [router])

  const hasResults = useMemo(() => 
    results.length > 0 || artistasResults.length > 0 || albunsResults.length > 0
  , [results.length, artistasResults.length, albunsResults.length])

  // Componente de ícone de música memoizado
  const MusicIcon = useCallback((props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ), [])

  return (
    <div ref={searchRef} className="relative w-full md:w-96">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => hasResults && setIsOpen(true)}
          placeholder="Buscar músicas, artistas, álbuns..."
          className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder:text-gray-500"
          aria-label="Buscar"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        {query && !loading && (
          <button 
            onClick={handleClear} 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Limpar busca"
          >
            <X size={14} className="text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden z-50 animate-fade-in max-h-96 overflow-y-auto shadow-2xl">
          
          {/* Seção de Artistas */}
          {artistasResults.length > 0 && (
            <div className="p-2 border-b border-white/10">
              <div className="px-3 py-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Artistas
              </div>
              {artistasResults.map((artista) => (
                <button
                  key={artista.artista}
                  onClick={() => handleArtistaClick(artista.artista)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {artista.url_capa ? (
                      <Image src={artista.url_capa} alt={artista.artista} fill className="object-cover" />
                    ) : (
                      <Mic2 size={18} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{artista.artista}</p>
                    <p className="text-gray-400 text-xs">Artista</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Seção de Álbuns */}
          {albunsResults.length > 0 && (
            <div className="p-2 border-b border-white/10">
              <div className="px-3 py-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
                Álbuns
              </div>
              {albunsResults.map((album) => (
                <button
                  key={album.album}
                  onClick={() => handleAlbumClick(album.album, album.artista)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {album.url_capa ? (
                      <Image src={album.url_capa} alt={album.album} fill className="object-cover" />
                    ) : (
                      <Disc3 size={18} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{album.album}</p>
                    <p className="text-gray-400 text-xs truncate">{album.artista}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Seção de Músicas */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-green-400 uppercase tracking-wider">
                Músicas
              </div>
              {results.map((music) => (
                <button
                  key={music.id}
                  onClick={() => handleMusicClick(music)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-left group"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {music.url_capa ? (
                      <Image src={music.url_capa} alt={music.titulo} fill className="object-cover" />
                    ) : (
                      <MusicIcon size={16} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{music.titulo}</p>
                    <p className="text-gray-400 text-xs truncate">{music.artista}</p>
                  </div>
                  <Play size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Ver tudo */}
          {query.length >= 2 && (
            <div className="p-2 border-t border-white/10 bg-white/5">
              <button
                onClick={() => {
                  setIsOpen(false)
                  if (onSearch) onSearch(query)
                  router.push(`/explore?search=${encodeURIComponent(query)}`)
                }}
                className="w-full text-center py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Ver todos os resultados para "{query}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}