'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Playlist, Musica } from '@/types'
import { Play, Plus, Search, X, Trash2, ChevronLeft, Edit2 } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'

// Cache da playlist atual
const playlistCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

export default function PlaylistPage() {
  const { id } = useParams()
  const router = useRouter()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [allMusicas, setAllMusicas] = useState<Musica[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const { setCurrentSong } = usePlayerStore()
  const { user } = useAuth()
  const isMountedRef = useRef(true)

  const fetchPlaylistData = useCallback(async (forceRefresh = false) => {
    if (!id) return

    // Verificar cache
    const cached = playlistCache.get(id as string)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPlaylist(cached.data.playlist)
      setMusicas(cached.data.musicas)
      setLoading(false)
      return
    }

    setLoading(true)
    const supabaseAny = supabase as any

    try {
      // Buscar dados da playlist e músicas em paralelo
      const [playlistResult, musicasResult] = await Promise.all([
        supabaseAny
          .from('playlists')
          .select('*')
          .eq('id', id)
          .single(),
        supabaseAny
          .from('playlist_musicas')
          .select(`
            ordem,
            musicas:musica_id (*)
          `)
          .eq('playlist_id', id)
          .order('ordem', { ascending: true })
      ])

      if (playlistResult.error) throw playlistResult.error
      if (playlistResult.data) setPlaylist(playlistResult.data)

      let musicasList: Musica[] = []
      if (musicasResult.data && musicasResult.data.length > 0) {
        musicasList = musicasResult.data
          .map((item: any) => item.musicas)
          .filter((m: Musica) => m !== null)
        setMusicas(musicasList)
      } else {
        setMusicas([])
      }

      // Salvar no cache
      playlistCache.set(id as string, {
        data: { playlist: playlistResult.data, musicas: musicasList },
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Erro ao buscar playlist:', error)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [id])

  const fetchAllMusicas = useCallback(async () => {
    const supabaseAny = supabase as any
    const { data } = await supabaseAny
      .from('musicas')
      .select('*')
      .limit(100)
    
    if (data && isMountedRef.current) setAllMusicas(data)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchPlaylistData()
    fetchAllMusicas()
    
    return () => {
      isMountedRef.current = false
    }
  }, [fetchPlaylistData, fetchAllMusicas])

  const addMusicToPlaylist = useCallback(async (musicaId: string) => {
    if (!user) {
      alert('Faça login para adicionar músicas')
      return
    }

    setIsAdding(true)
    const ordem = musicas.length
    const supabaseAny = supabase as any

    try {
      const { error } = await supabaseAny
        .from('playlist_musicas')
        .insert({
          playlist_id: id as string,
          musica_id: musicaId,
          ordem: ordem
        })

      if (error) throw error

      // Limpar cache e recarregar
      playlistCache.delete(id as string)
      await fetchPlaylistData(true)
      setShowAddModal(false)
      setSearchQuery('')
    } catch (error) {
      console.error('Erro ao adicionar:', error)
      alert('Erro ao adicionar música')
    } finally {
      setIsAdding(false)
    }
  }, [user, musicas.length, id, fetchPlaylistData])

  const removeMusicFromPlaylist = useCallback(async (musicaId: string) => {
    setIsRemoving(musicaId)
    const supabaseAny = supabase as any

    try {
      const { error } = await supabaseAny
        .from('playlist_musicas')
        .delete()
        .eq('playlist_id', id as string)
        .eq('musica_id', musicaId)

      if (error) throw error

      // Limpar cache e recarregar
      playlistCache.delete(id as string)
      await fetchPlaylistData(true)
    } catch (error) {
      console.error('Erro ao remover:', error)
      alert('Erro ao remover música')
    } finally {
      setIsRemoving(null)
    }
  }, [id, fetchPlaylistData])

  const playAll = useCallback(() => {
    if (musicas.length > 0) {
      setCurrentSong(musicas[0], musicas)
    }
  }, [musicas, setCurrentSong])

  const filteredMusicas = useMemo(() => {
    return allMusicas.filter(m => 
      !musicas.some(playlistMusic => playlistMusic.id === m.id) &&
      (m.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
       m.artista.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [allMusicas, musicas, searchQuery])

  const totalDuration = useMemo(() => {
    const totalSeconds = musicas.reduce((acc, m) => acc + (m.duracao || 0), 0)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }, [musicas])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-white/10 rounded-2xl" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-gray-400">Playlist não encontrada</p>
        <button 
          onClick={() => router.push('/library')}
          className="mt-4 text-purple-400 hover:text-purple-300 transition-colors"
        >
          Voltar para Biblioteca
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header com botão voltar */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Voltar
      </button>

      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-6 glass rounded-2xl p-6 group">
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
          {playlist.url_capa ? (
            <Image
              src={playlist.url_capa}
              alt={playlist.nome}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">Playlist</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
            {playlist.nome}
          </h1>
          {playlist.descricao && (
            <p className="text-gray-300 mb-3">{playlist.descricao}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
            <span>{musicas.length} {musicas.length === 1 ? 'música' : 'músicas'}</span>
            {musicas.length > 0 && (
              <>
                <span>•</span>
                <span>{totalDuration}</span>
              </>
            )}
            <span>•</span>
            <span>Criada em {new Date(playlist.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={playAll}
              disabled={musicas.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            >
              <Play size={18} fill="white" />
              Reproduzir
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white/10 px-6 py-2.5 rounded-full font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar Música
            </button>
          </div>
        </div>
      </div>

      {/* Music List */}
      {musicas.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3 hidden md:table-cell">Álbum</th>
                  <th className="px-4 py-3">Artista</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {musicas.map((musica, index) => (
                  <tr 
                    key={musica.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-4 py-3 text-gray-400 text-sm">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          {musica.url_capa ? (
                            <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                          )}
                        </div>
                        <span className="text-white font-medium">{musica.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {musica.album || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{musica.artista}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeMusicFromPlaylist(musica.id)}
                        disabled={isRemoving === musica.id}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                      >
                        {isRemoving === musica.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play size={32} className="text-purple-400" />
          </div>
          <p className="text-gray-400 mb-4">Sua playlist está vazia</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Adicionar músicas
          </button>
        </div>
      )}

      {/* Add Music Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Adicionar Músicas</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
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
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMusicas.length > 0 ? (
                filteredMusicas.map((musica) => (
                  <button
                    key={musica.id}
                    onClick={() => addMusicToPlaylist(musica.id)}
                    disabled={isAdding}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {musica.url_capa ? (
                        <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{musica.titulo}</p>
                      <p className="text-gray-400 text-xs truncate">{musica.artista}</p>
                    </div>
                    {isAdding ? (
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={16} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <Search size={32} className="text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery ? 'Nenhuma música encontrada' : 'Busque por músicas para adicionar'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}