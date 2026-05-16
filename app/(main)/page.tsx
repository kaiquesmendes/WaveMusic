'use client'

import { useEffect, useState } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { Play, TrendingUp, Clock, Heart, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function HomePage() {
  const [recentSongs, setRecentSongs] = useState<Musica[]>([])
  const [recommendations, setRecommendations] = useState<Musica[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentSong } = usePlayerStore()
  const { user } = useAuth()

  useEffect(() => {
    fetchAllData()
  }, [user])

  async function fetchAllData() {
    setLoading(true)
    
    // Buscar todas as músicas
    const { data: musicas } = await supabase
      .from('musicas')
      .select('*')
      .limit(50)

    if (musicas) {
      setRecentSongs(musicas.slice(0, 8))
      
      // Sistema de recomendação baseado em histórico e favoritos
      let recommendedIds: string[] = []
      
      if (user) {
        // Buscar histórico do usuário
        const { data: history } = await supabase
          .from('historico')
          .select('musica:musica_id(*)')
          .eq('usuario_id', user.id)
          .order('played_at', { ascending: false })
          .limit(10)
        
        // Buscar favoritos do usuário
        const { data: userFavorites } = await supabase
          .from('favoritos')
          .select('musica:musica_id(*)')
          .eq('usuario_id', user.id)
        
        if (userFavorites) {
          setFavorites(userFavorites.map(f => f.musica as unknown as Musica))
        }
        
        // Obter gêneros favoritos do usuário
        const favoriteMusics = userFavorites?.map(f => f.musica as unknown as Musica) || []
        const historyMusics = history?.map(h => h.musica as unknown as Musica) || []
        const allUserMusics = [...favoriteMusics, ...historyMusics]
        
        // Contar gêneros
        const genreCount: Record<string, number> = {}
        allUserMusics.forEach(m => {
          if (m.genero) {
            genreCount[m.genero] = (genreCount[m.genero] || 0) + 1
          }
        })
        
        // Encontrar gênero favorito
        const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0]
        
        // Buscar recomendações do mesmo gênero
        if (topGenre) {
          const { data: genreMusics } = await supabase
            .from('musicas')
            .select('*')
            .eq('genero', topGenre)
            .limit(8)
          
          if (genreMusics) {
            recommendedIds = genreMusics.map(m => m.id)
          }
        }
      }
      
      // Se não tiver recomendações baseadas em gênero, pega músicas aleatórias
      if (recommendedIds.length === 0) {
        const shuffled = [...musicas].sort(() => 0.5 - Math.random())
        recommendedIds = shuffled.slice(8, 16).map(m => m.id)
      }
      
      const recommended = musicas.filter(m => recommendedIds.includes(m.id))
      setRecommendations(recommended.slice(0, 8))
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 animate-gradient bg-[length:200%_200%]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col justify-center px-6 md:px-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
            Bem-vindo ao<br />
            <span className="bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              WaveMusic
            </span>
          </h1>
          <p className="text-sm md:text-base text-white/80 mb-4 max-w-md">
            Descubra novas músicas baseadas no seu gosto musical.
          </p>
          {recommendations[0] && (
            <button
              onClick={() => setCurrentSong(recommendations[0], recommendations)}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform w-fit flex items-center gap-2 shadow-lg"
            >
              <Play size={16} fill="black" />
              Ouvir Recomendação
            </button>
          )}
        </div>
      </div>

      {/* Seção de Favoritos */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={22} className="text-pink-400" fill="currentColor" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Suas Curtidas</h2>
          </div>
          <MusicGrid musicas={favorites.slice(0, 8)} loading={loading} />
        </section>
      )}

      {/* Seção Recomendações Personalizadas */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={22} className="text-yellow-400" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Recomendadas para Você</h2>
        </div>
        <MusicGrid musicas={recommendations} loading={loading} />
      </section>

      {/* Seção Recentes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={22} className="text-purple-400" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Lançamentos</h2>
        </div>
        <MusicGrid musicas={recentSongs} loading={loading} />
      </section>
    </div>
  )
}