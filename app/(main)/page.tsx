'use client'

import { useEffect, useState } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { Play, TrendingUp, Clock, Heart, Sparkles, Headphones } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function HomePage() {
  const [recentSongs, setRecentSongs] = useState<Musica[]>([])
  const [recommendations, setRecommendations] = useState<Musica[]>([])
  const [featuredSong, setFeaturedSong] = useState<Musica | null>(null)
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentSong } = usePlayerStore()
  const { user } = useAuth()

  useEffect(() => {
    fetchAllData()
  }, [user])

  async function fetchAllData() {
    setLoading(true)
    
    const { data: musicas } = await supabase
      .from('musicas')
      .select('*')
      .limit(30)

    if (musicas && musicas.length > 0) {
      setRecentSongs(musicas.slice(0, 8))
      setRecommendations(musicas.slice(8, 16))
      setFeaturedSong(musicas[0])
      
      if (user?.id) {
        const supabaseAny = supabase as any
        const { data: favoritosData } = await supabaseAny
          .from('favoritos')
          .select('musica_id')
          .eq('usuario_id', user.id)
          .limit(8)

        if (favoritosData && favoritosData.length > 0) {
          const musicasIds = favoritosData.map((f: any) => f.musica_id)
          const { data: musicasFav } = await supabaseAny
            .from('musicas')
            .select('*')
            .in('id', musicasIds)
          
          if (musicasFav) {
            setFavorites(musicasFav)
          }
        }
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in pb-20">
      {/* Hero Banner - Featured */}
      {featuredSong && (
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 animate-gradient bg-[length:200%_200%]" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500" />
          
          <div className="relative h-full flex flex-col justify-center px-6 md:px-10">
            <div className="animate-slide-up">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-4">
                <Sparkles size={12} className="text-yellow-400" />
                Destaque da Semana
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {featuredSong.titulo}
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-4">
                {featuredSong.artista}
              </p>
              <button
                onClick={() => setCurrentSong(featuredSong)}
                className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform w-fit flex items-center gap-2 shadow-xl"
              >
                <Play size={18} fill="black" />
                Ouvir Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Favoritos */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20">
              <Heart size={20} className="text-pink-400" fill="currentColor" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Suas Curtidas</h2>
          </div>
          <MusicGrid musicas={favorites} loading={loading} />
        </section>
      )}

      {/* Seção Recomendações */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <TrendingUp size={20} className="text-purple-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Recomendadas para Você</h2>
        </div>
        <MusicGrid musicas={recommendations} loading={loading} />
      </section>

      {/* Seção Lançamentos */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
            <Clock size={20} className="text-green-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Lançamentos</h2>
        </div>
        <MusicGrid musicas={recentSongs} loading={loading} />
      </section>

      {/* Call to Action */}
      <div className="glass rounded-2xl p-6 md:p-8 text-center">
        <Headphones size={40} className="text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          Descubra novas músicas
        </h3>
        <p className="text-gray-400 mb-4 max-w-md mx-auto">
          Explore nossa biblioteca e encontre suas próximas músicas favoritas
        </p>
        <button 
          onClick={() => window.location.href = '/explore'}
          className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          Explorar Agora
        </button>
      </div>
    </div>
  )
}