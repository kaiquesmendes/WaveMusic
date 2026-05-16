'use client'

import { useState, useEffect } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { SearchBar } from '@/components/Search/SearchBar'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { Compass, X } from 'lucide-react'

interface MusicRow {
  id: string
  titulo: string
  artista: string
  album: string | null
  duracao: number
  url_audio: string
  url_capa: string | null
  genero: string | null
  created_at: string
}

export default function ExplorePage() {
  const [musicas, setMusicas] = useState<MusicRow[]>([])
  const [filteredMusicas, setFilteredMusicas] = useState<MusicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generos, setGeneros] = useState<string[]>([])
  const [selectedGenero, setSelectedGenero] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMusicas()
  }, [])

  async function fetchMusicas() {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar músicas:', error)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      setMusicas(data as MusicRow[])
      setFilteredMusicas(data as MusicRow[])
      
      // Extrair gêneros únicos
      const generosSet = new Set<string>()
      data.forEach((item: any) => {
        if (item.genero && item.genero.trim()) {
          generosSet.add(item.genero)
        }
      })
      setGeneros(Array.from(generosSet))
    }
    setLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(query, selectedGenero)
  }

  const handleGeneroFilter = (genero: string) => {
    setSelectedGenero(genero)
    applyFilters(searchQuery, genero)
  }

  const applyFilters = (query: string, genero: string) => {
    let filtered = [...musicas]
    
    if (query) {
      filtered = filtered.filter(m => 
        m.titulo.toLowerCase().includes(query.toLowerCase()) ||
        m.artista.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (genero) {
      filtered = filtered.filter(m => m.genero === genero)
    }
    
    setFilteredMusicas(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenero('')
    setFilteredMusicas(musicas)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-black/50 backdrop-blur-md py-4 z-10">
        <div className="flex items-center gap-2">
          <Compass size={28} className="text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Explorar</h1>
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {generos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap bg-white/10 text-gray-300 hover:bg-white/20 flex items-center gap-1"
          >
            <X size={14} />
            Limpar
          </button>
          <button
            onClick={() => handleGeneroFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              !selectedGenero
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {generos.map(genero => (
            <button
              key={genero}
              onClick={() => handleGeneroFilter(genero)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedGenero === genero
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {genero}
            </button>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-400">
        {filteredMusicas.length} músicas encontradas
      </div>

      <MusicGrid musicas={filteredMusicas as any} loading={loading} />
    </div>
  )
}