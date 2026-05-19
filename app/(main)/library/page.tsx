'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { PlaylistCard } from '@/components/Playlist/PlaylistCard'
import { MusicList } from '@/components/Music/MusicList'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Playlist, Musica } from '@/types'
import { Library, ListMusic, Heart, Plus, Music, Disc3, TrendingUp, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { CreatePlaylistModal } from '@/components/Playlist/CreatePlaylistModal'

// Cache de dados da biblioteca
const libraryCache = {
  data: null as {
    playlists: Playlist[]
    favorites: Musica[]
    stats: { totalSongs: number; totalPlaylists: number; totalFavorites: number }
  } | null,
  timestamp: 0,
  expiryTime: 3 * 60 * 1000, // 3 minutos
  isValid: () => Date.now() - libraryCache.timestamp < libraryCache.expiryTime
}

export default function LibraryPage() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([])
  const [stats, setStats] = useState({ totalSongs: 0, totalPlaylists: 0, totalFavorites: 0 })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isMountedRef = useRef(true)

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Usar cache se válido e não for refresh forçado
    if (!forceRefresh && libraryCache.isValid() && libraryCache.data) {
      setPlaylists(libraryCache.data.playlists)
      setFavorites(libraryCache.data.favorites)
      setStats(libraryCache.data.stats)
      setRecentPlaylists(libraryCache.data.playlists.slice(0, 4))
      setLoading(false)
      return
    }

    if (isRefreshing) return
    setIsRefreshing(true)
    if (!forceRefresh) setLoading(true)

    const supabaseAny = supabase as any

    try {
      // Executar queries em paralelo para melhor performance
      const [playlistsResult, favoritesResult, totalSongsResult] = await Promise.all([
        supabaseAny
          .from('playlists')
          .select('*')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false }),
        supabaseAny
          .from('favoritos')
          .select(`
            musica_id,
            musicas:musica_id (*)
          `)
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false }),
        supabaseAny
          .from('musicas')
          .select('*', { count: 'exact', head: true })
      ])

      const playlistsData = playlistsResult.data || []
      
      // Processar capas das playlists em paralelo (Promise.all otimizado)
      const playlistsWithCovers = await Promise.all(
        playlistsData.map(async (playlist: Playlist) => {
          const { data: playlistMusic } = await supabaseAny
            .from('playlist_musicas')
            .select('musica:musica_id(*)')
            .eq('playlist_id', playlist.id)
            .limit(1)
          
          let coverUrl = null
          if (playlistMusic && playlistMusic.length > 0) {
            const music = (playlistMusic[0] as any).musica
            coverUrl = music?.url_capa || null
          }
          
          return { ...playlist, url_capa: coverUrl }
        })
      )

      let favoritesList: Musica[] = []
      if (favoritesResult.data && favoritesResult.data.length > 0) {
        favoritesList = favoritesResult.data
          .map((item: any) => item.musicas)
          .filter((m: Musica) => m !== null)
      }
      
      const newStats = {
        totalSongs: totalSongsResult.count || 0,
        totalPlaylists: playlistsData.length,
        totalFavorites: favoritesList.length
      }

      // Salvar no cache
      libraryCache.data = {
        playlists: playlistsWithCovers,
        favorites: favoritesList,
        stats: newStats
      }
      libraryCache.timestamp = Date.now()

      if (isMountedRef.current) {
        setPlaylists(playlistsWithCovers)
        setFavorites(favoritesList)
        setStats(newStats)
        setRecentPlaylists(playlistsWithCovers.slice(0, 4))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [user?.id])

  // Carregar dados iniciais
  useEffect(() => {
    isMountedRef.current = true
    fetchUserData()
    
    return () => {
      isMountedRef.current = false
    }
  }, [fetchUserData])

  const handleRefresh = useCallback(() => {
    fetchUserData(true)
  }, [fetchUserData])

  // Memoizar componentes
  const heroSection = useMemo(() => (
    <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden mb-8 group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 animate-gradient bg-[length:200%_200%]" />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all" />
      <div className="relative h-full flex flex-col justify-center px-6 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Library size={32} className="text-white" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">Sua Biblioteca</h1>
        </div>
        <p className="text-white/80 text-sm max-w-md">
          Gerencie suas playlists e músicas favoritas em um só lugar
        </p>
      </div>
      <button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="absolute top-4 right-4 glass-dark rounded-full p-2 hover:scale-105 transition-all disabled:opacity-50"
        title="Atualizar"
      >
        <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  ), [isRefreshing, handleRefresh])

  const statsCards = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        icon={<ListMusic size={20} />}
        value={stats.totalPlaylists}
        label="Playlists"
        color="purple"
        delay={0}
      />
      <StatCard 
        icon={<Heart size={20} />}
        value={stats.totalFavorites}
        label="Curtidas"
        color="pink"
        delay={1}
      />
      <StatCard 
        icon={<Music size={20} />}
        value={stats.totalSongs}
        label="Músicas disponíveis"
        color="green"
        delay={2}
      />
      <StatCard 
        icon={<TrendingUp size={20} />}
        value={user ? 'Personalizado' : 'Descubra'}
        label="Para você"
        color="orange"
        delay={3}
      />
    </div>
  ), [stats, user])

  const playlistsSection = useMemo(() => {
    if (playlists.length === 0) return null

    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Disc3 size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Minhas Playlists</h2>
            <span className="text-xs text-gray-500">{playlists.length} playlists</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Criar nova
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist, index) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    )
  }, [playlists])

  const recentPlaylistsSection = useMemo(() => {
    if (recentPlaylists.length === 0 || playlists.length === recentPlaylists.length) return null

    return (
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <Clock size={20} className="text-blue-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Recentes</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recentPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    )
  }, [recentPlaylists, playlists.length])

  const favoritesSection = useMemo(() => (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20">
            <Heart size={20} className="text-pink-400" fill="currentColor" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Músicas Curtidas</h2>
          <span className="text-xs text-gray-500">{favorites.length} músicas</span>
        </div>
        {favorites.length > 5 && (
          <Link href="/favorites" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Ver todas →
          </Link>
        )}
      </div>
      
      {favorites.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <MusicList musicas={favorites.slice(0, 5)} />
          {favorites.length > 5 && (
            <div className="p-4 border-t border-white/10 text-center">
              <Link href="/favorites" className="text-sm text-purple-400 hover:text-purple-300">
                + {favorites.length - 5} outras músicas curtidas
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Heart size={48} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-3">Você ainda não curtiu nenhuma música</p>
          <p className="text-sm text-gray-500 mb-4">Clique no coração ♥ ao ouvir suas músicas favoritas</p>
          <Link 
            href="/explore" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <Music size={16} />
            Explorar músicas
          </Link>
        </div>
      )}
    </section>
  ), [favorites])

  const emptyState = useMemo(() => {
    if (playlists.length > 0 || favorites.length > 0) return null

    return (
      <div className="mt-10 glass rounded-2xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
          <Disc3 size={40} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Comece sua jornada musical</h3>
        <p className="text-gray-400 mb-4 max-w-md mx-auto">
          Crie playlists personalizadas, curta suas músicas favoritas e descubra novos artistas
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Criar playlist
          </button>
          <Link 
            href="/explore"
            className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-medium transition-all inline-flex items-center gap-2"
          >
            <Music size={16} />
            Explorar músicas
          </Link>
        </div>
      </div>
    )
  }, [playlists.length, favorites.length])

  // Estado de loading
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-white/10 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl h-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {heroSection}
      {statsCards}
      {playlistsSection}
      {recentPlaylistsSection}
      {favoritesSection}
      {emptyState}

      <CreatePlaylistModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        fetchUserData(true) // Recarregar com força ao criar playlist
      }} />
    </div>
  )
}

// Componente de Card de Estatística com animação
function StatCard({ icon, value, label, color, delay = 0 }: { 
  icon: React.ReactNode; 
  value: number | string; 
  label: string; 
  color: string;
  delay?: number;
}) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    pink: 'from-pink-500/20 to-red-500/20 text-pink-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    orange: 'from-orange-500/20 to-amber-500/20 text-orange-400'
  }

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value

  return (
    <div 
      className="glass rounded-xl p-4 text-center group hover:scale-105 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]} flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">
        {displayValue}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}