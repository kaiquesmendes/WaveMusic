'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'

interface SearchBarProps {
  onSearch?: (query: string) => void
  initialValue?: string
}

export function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<Musica[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { setCurrentSong } = usePlayerStore()

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchMusic = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      const supabaseAny = supabase as any
      const { data } = await supabaseAny
        .from('musicas')
        .select('*')
        .or(`titulo.ilike.%${query}%,artista.ilike.%${query}%,genero.ilike.%${query}%,album.ilike.%${query}%`)
        .limit(5)
      
      if (data) {
        setResults(data)
        setIsOpen(true)
      }
      setLoading(false)
    }

    const debounce = setTimeout(searchMusic, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (onSearch) onSearch('')
  }

  const handleResultClick = (music: Musica) => {
    setCurrentSong(music)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative w-full md:w-96">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar por música, artista, álbum ou gênero..."
          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        {query && !loading && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-50 animate-fade-in max-h-96 overflow-y-auto">
          {results.map((music) => (
            <button
              key={music.id}
              onClick={() => handleResultClick(music)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
            >
              <div className="relative w-10 h-10 rounded overflow-hidden">
                {music.url_capa ? (
                  <Image src={music.url_capa} alt={music.titulo} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{music.titulo}</p>
                <p className="text-gray-400 text-xs truncate">{music.artista}</p>
              </div>
              <Play size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Import Play
import { Play } from 'lucide-react'