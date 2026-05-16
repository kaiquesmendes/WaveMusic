'use client'

import { useEffect, useState } from 'react'
import { PlaylistCard } from '@/components/Playlist/PlaylistCard'
import { MusicList } from '@/components/Music/MusicList'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Playlist, Musica } from '@/types'
import { Library, ListMusic, Heart, Plus, Music, Disc3, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CreatePlaylistModal } from '@/components/Playlist/CreatePlaylistModal'

export default function LibraryPage() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([])
  const [stats, setStats] = useState({ totalSongs: 0, totalPlaylists: 0, totalFavorites: 0 })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchUserData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const supabaseAny = supabase as any

    // Fetch playlists
    const { data: playlistsData } = await supabaseAny
      .from('playlists')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    // Para cada playlist, buscar uma capa
    if (playlistsData) {
      const playlistsWithCovers = await Promise.all(
        playlistsData.map(async (playlist: Playlist) => {
          // Buscar primeira música da playlist para usar como capa
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
      setPlaylists(playlistsWithCovers)
      setRecentPlaylists(playlistsWithCovers.slice(0, 4))
    }

    // Fetch favorites
    const { data: favoritosData } = await supabaseAny
      .from('favoritos')
      .select(`
        musica_id,
        musicas:musica_id (*)
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    let favoritesList: Musica[] = []
    if (favoritosData && favoritosData.length > 0) {
      favoritesList = favoritosData
        .map((item: any) => item.musicas)
        .filter((m: Musica) => m !== null)
      setFavorites(favoritesList)
    }
    
    // Fetch stats
    const { count: totalSongs } = await supabaseAny
      .from('musicas')
      .select('*', { count: 'exact', head: true })
    
    setStats({
      totalSongs: totalSongs || 0,
      totalPlaylists: playlistsData?.length || 0,
      totalFavorites: favoritesList.length
    })
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-white/10 rounded w-48" />
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
      {/* Hero Section */}
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={<ListMusic size={20} />}
          value={stats.totalPlaylists}
          label="Playlists"
          color="purple"
        />
        <StatCard 
          icon={<Heart size={20} />}
          value={stats.totalFavorites}
          label="Curtidas"
          color="pink"
        />
        <StatCard 
          icon={<Music size={20} />}
          value={stats.totalSongs}
          label="Músicas disponíveis"
          color="green"
        />
        <StatCard 
          icon={<TrendingUp size={20} />}
          value={user ? 'Personalizado' : 'Descubra'}
          label="Para você"
          color="orange"
        />
      </div>

      {/* Playlists Section - Destaque */}
      {playlists.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                <Disc3 size={20} className="text-purple-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Minhas Playlists</h2>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              Criar nova
            </button>
          </div>
          
          {playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ListMusic size={32} className="text-purple-400" />
              </div>
              <p className="text-gray-400 mb-4">Você ainda não tem playlists</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Criar primeira playlist
              </button>
            </div>
          )}
        </section>
      )}

      {/* Playlists Recentes */}
      {recentPlaylists.length > 0 && (
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
      )}

      {/* Favorites Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20">
              <Heart size={20} className="text-pink-400" fill="currentColor" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Músicas Curtidas</h2>
          </div>
          <Link href="/favorites" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Ver todas →
          </Link>
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

      {/* Call to Action - Criar Playlist Rápida */}
      {playlists.length === 0 && favorites.length === 0 && (
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
      )}

      <CreatePlaylistModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        fetchUserData()
      }} />
    </div>
  )
}

// Componente de Card de Estatística
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    pink: 'from-pink-500/20 to-red-500/20 text-pink-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    orange: 'from-orange-500/20 to-amber-500/20 text-orange-400'
  }

  return (
    <div className="glass rounded-xl p-4 text-center group hover:scale-105 transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]} flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}