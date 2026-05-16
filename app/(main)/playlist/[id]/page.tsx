'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Playlist, Musica } from '@/types'
import { Play, Plus, Search, X, Trash2 } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'

export default function PlaylistPage() {
  const { id } = useParams()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [allMusicas, setAllMusicas] = useState<Musica[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { setCurrentSong } = usePlayerStore()
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchPlaylistData()
      fetchAllMusicas()
    }
  }, [id])

  async function fetchPlaylistData() {
    try {
      setLoading(true)
      
      // Buscar dados da playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single()

      if (playlistError) {
        console.error('Erro ao buscar playlist:', playlistError)
        return
      }

      if (playlistData) {
        setPlaylist(playlistData)
      }

      // Buscar músicas da playlist usando join
      const { data: playlistMusicas, error: musicasError } = await supabase
        .from('playlist_musicas')
        .select(`
          ordem,
          musicas:musica_id (*)
        `)
        .eq('playlist_id', id)
        .order('ordem', { ascending: true })

      if (musicasError) {
        console.error('Erro ao buscar músicas da playlist:', musicasError)
        setMusicas([])
        return
      }

      if (playlistMusicas && playlistMusicas.length > 0) {
        const musicasList = playlistMusicas
          .map(item => (item as any).musicas)
          .filter((m): m is Musica => m !== null)
        setMusicas(musicasList)
      } else {
        setMusicas([])
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllMusicas() {
    const { data } = await supabase
      .from('musicas')
      .select('*')
      .limit(100)
    
    if (data) setAllMusicas(data)
  }

  async function addMusicToPlaylist(musicaId: string) {
    if (!user) {
      alert('Faça login para adicionar músicas')
      return
    }

    const ordem = musicas.length
    const { error } = await supabase
      .from('playlist_musicas')
      .insert({
        playlist_id: id as string,
        musica_id: musicaId,
        ordem: ordem
      })

    if (error) {
      console.error('Erro ao adicionar:', error)
      alert(`Erro: ${error.message}`)
    } else {
      await fetchPlaylistData()
      setShowAddModal(false)
      setSearchQuery('')
    }
  }

  async function removeMusicFromPlaylist(musicaId: string) {
    const { error } = await supabase
      .from('playlist_musicas')
      .delete()
      .eq('playlist_id', id as string)
      .eq('musica_id', musicaId)

    if (error) {
      console.error('Erro ao remover:', error)
      alert(`Erro: ${error.message}`)
    } else {
      await fetchPlaylistData()
    }
  }

  const playAll = () => {
    if (musicas.length > 0) {
      setCurrentSong(musicas[0], musicas)
    }
  }

  const filteredMusicas = allMusicas.filter(m => 
    !musicas.some(playlistMusic => playlistMusic.id === m.id) &&
    (m.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.artista.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-white/10 rounded-2xl" />
        <div className="h-96 bg-white/10 rounded-xl" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Playlist não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-6 glass rounded-2xl p-6">
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
          {playlist.url_capa ? (
            <Image
              src={playlist.url_capa}
              alt={playlist.nome}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">Playlist</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {playlist.nome}
          </h1>
          {playlist.descricao && (
            <p className="text-gray-300 mb-4">{playlist.descricao}</p>
          )}
          <p className="text-gray-400 text-sm">
            {musicas.length} {musicas.length === 1 ? 'música' : 'músicas'}
          </p>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={playAll}
              disabled={musicas.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Play size={18} fill="white" />
              Play
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white/10 px-6 py-2 rounded-full font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar Música
            </button>
          </div>
        </div>
      </div>

      {/* Music List */}
      {musicas.length > 0 ? (
        <div className="space-y-2">
          {musicas.map((musica, index) => (
            <div key={musica.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group">
              <span className="text-gray-400 text-sm w-8">{index + 1}</span>
              <div className="relative w-10 h-10 rounded overflow-hidden">
                {musica.url_capa ? (
                  <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{musica.titulo}</p>
                <p className="text-gray-400 text-sm">{musica.artista}</p>
              </div>
              <button
                onClick={() => removeMusicFromPlaylist(musica.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">Nenhuma música nesta playlist</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-purple-400 hover:text-purple-300"
          >
            + Adicionar músicas
          </button>
        </div>
      )}

      {/* Add Music Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-scale-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Adicionar Músicas</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar músicas..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMusicas.map((musica) => (
                <button
                  key={musica.id}
                  onClick={() => addMusicToPlaylist(musica.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="relative w-10 h-10 rounded overflow-hidden">
                    {musica.url_capa ? (
                      <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{musica.titulo}</p>
                    <p className="text-gray-400 text-xs">{musica.artista}</p>
                  </div>
                  <Plus size={16} className="text-gray-400" />
                </button>
              ))}
              {filteredMusicas.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  Nenhuma música disponível para adicionar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}