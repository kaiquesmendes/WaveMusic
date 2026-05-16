'use client'

import { useEffect, useState } from 'react'
import { MusicList } from '@/components/Music/MusicList'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Musica } from '@/types'
import { Heart, Music, Clock, TrendingUp, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePlayerStore } from '@/store/playerStore'
import Image from 'next/image'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalMinutes: 0, topArtist: '', topGenre: '' })
  const { setCurrentSong } = usePlayerStore()

  useEffect(() => {
    if (user?.id) {
      fetchFavorites()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchFavorites() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    
    try {
      const supabaseAny = supabase as any
      
      const { data, error } = await supabaseAny
        .from('favoritos')
        .select(`
          musica_id,
          musicas:musica_id (*)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar favoritos:', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const musicasList = data
          .map((item: any) => item.musicas)
          .filter((m: Musica) => m !== null)
        setFavorites(musicasList)
        
        // Calcular estatísticas
        const totalSeconds = musicasList.reduce((acc: number, m: Musica) => acc + (m.duracao || 0), 0)
        const totalMinutes = Math.floor(totalSeconds / 60)
        
        const artistCount: Record<string, number> = {}
        const genreCount: Record<string, number> = {}
        
        musicasList.forEach((m: Musica) => {
          if (m.artista) artistCount[m.artista] = (artistCount[m.artista] || 0) + 1
          if (m.genero) {
            const genres = m.genero.split(',').map(g => g.trim())
            genres.forEach(g => {
              genreCount[g] = (genreCount[g] || 0) + 1
            })
          }
        })
        
        const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhum'
        const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhum'
        
        setStats({ totalMinutes, topArtist, topGenre })
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  const playAllFavorites = () => {
    if (favorites.length > 0) {
      setCurrentSong(favorites[0], favorites)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white/10 rounded-2xl" />
        <div className="h-8 bg-white/10 rounded w-48" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Hero Section */}
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-purple-600 animate-gradient bg-[length:200%_200%]" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all" />
        
        {/* Elementos decorativos */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Heart size={80} className="text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Music size={60} className="text-white" />
        </div>
        
        <div className="relative h-full flex flex-col justify-center px-6 md:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Heart size={28} className="text-pink-400" fill="currentColor" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Músicas Curtidas</h1>
          </div>
          <p className="text-white/80 text-sm max-w-md">
            Todas as suas músicas favoritas em um só lugar
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Heart size={20} />}
            value={favorites.length}
            label="Músicas curtidas"
            color="pink"
          />
          <StatCard 
            icon={<Clock size={20} />}
            value={stats.totalMinutes}
            label="Minutos de música"
            color="purple"
            suffix="min"
          />
          <StatCard 
            icon={<TrendingUp size={20} />}
            value={stats.topArtist}
            label="Artista favorito"
            color="orange"
          />
          <StatCard 
            icon={<Music size={20} />}
            value={stats.topGenre}
            label="Gênero favorito"
            color="green"
          />
        </div>
      )}

      {/* Play All Button */}
      {favorites.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={playAllFavorites}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
          >
            <Play size={16} fill="white" />
            Reproduzir todas
          </button>
          <p className="text-sm text-gray-400">{favorites.length} músicas</p>
        </div>
      )}

      {/* Music List */}
      {favorites.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <MusicList musicas={favorites} showImage showAlbum />
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={40} className="text-pink-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Sua playlist está vazia</h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            Comece a curtir suas músicas favoritas clicando no coração ♥ enquanto ouve
          </p>
          <Link 
            href="/explore"
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-full font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <Music size={16} />
            Explorar músicas
          </Link>
        </div>
      )}

      {/* Dica para novos usuários */}
      {favorites.length === 0 && (
        <div className="mt-6 glass-dark rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Heart size={14} className="text-purple-400" />
          </div>
          <p className="text-sm text-gray-300">
            💡 Dica: Ao ouvir uma música, clique no ícone <Heart size={12} className="inline text-pink-400" /> para adicioná-la aos seus favoritos!
          </p>
        </div>
      )}
    </div>
  )
}

// Componente de Card de Estatística
function StatCard({ icon, value, label, color, suffix = '' }: { 
  icon: React.ReactNode; 
  value: number | string; 
  label: string; 
  color: string;
  suffix?: string;
}) {
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
      <div className="text-xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}