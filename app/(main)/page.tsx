'use client'

import { useEffect, useState, useCallback } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { Play, TrendingUp, Clock, Heart, Sparkles, Headphones, Calendar, Flame, Star, RefreshCw, Trophy, Radio } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Image from 'next/image'

export default function HomePage() {
  const [recentSongs, setRecentSongs] = useState<Musica[]>([])
  const [recommendations, setRecommendations] = useState<Musica[]>([])
  const [featuredSongs, setFeaturedSongs] = useState<Musica[]>([])
  const [weeklyTop, setWeeklyTop] = useState<Musica[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const { setCurrentSong, toggleGlobalShuffle, playRandomSong, isGlobalShuffle } = usePlayerStore()
  const { user } = useAuth()

  // Carregar dados
  useEffect(() => {
    fetchAllData()
  }, [user])

  // Carrossel de destaques (muda a cada 10 segundos)
  useEffect(() => {
    if (featuredSongs.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredSongs.length)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [featuredSongs.length])

  async function fetchAllData() {
    setLoading(true)
    
    const supabaseAny = supabase as any
    
    // Buscar todas as músicas
    const { data: musicas, error } = await supabaseAny
      .from('musicas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar músicas:', error)
      setLoading(false)
      return
    }

    if (musicas && musicas.length > 0) {
      // Lançamentos (mais recentes)
      setRecentSongs(musicas.slice(0, 8))
      
      // Destaques da Semana (músicas aleatórias que mudam)
      const shuffledForFeatured = [...musicas].sort(() => 0.5 - Math.random())
      setFeaturedSongs(shuffledForFeatured.slice(0, 5))
      
      // Top da Semana (músicas mais populares - simulando com aleatório)
      const shuffledForTop = [...musicas].sort(() => 0.5 - Math.random())
      setWeeklyTop(shuffledForTop.slice(0, 6))
      
      // Sistema de recomendação personalizada
      let recommendedIds: string[] = []
      
      if (user?.id) {
        // Buscar favoritos e histórico do usuário
        const { data: userFavorites } = await supabaseAny
          .from('favoritos')
          .select('musica:musica_id(*)')
          .eq('usuario_id', user.id)
        
        const { data: userHistory } = await supabaseAny
          .from('historico')
          .select('musica:musica_id(*)')
          .eq('usuario_id', user.id)
          .limit(30)
        
        const favoriteMusics = userFavorites?.map((f: any) => f.musica) || []
        const historyMusics = userHistory?.map((h: any) => h.musica) || []
        const allUserMusics = [...favoriteMusics, ...historyMusics].filter(Boolean)
        
        if (allUserMusics.length > 0) {
          // Contar gêneros preferidos
          const genreCount: Record<string, number> = {}
          allUserMusics.forEach((m: Musica) => {
            if (m.genero && m.genero !== 'null' && m.genero !== '') {
              genreCount[m.genero] = (genreCount[m.genero] || 0) + 1
            }
          })
          
          const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0]
          
          if (topGenre) {
            const userMusicIds = new Set(allUserMusics.map((m: Musica) => m.id))
            const { data: genreMusics } = await supabaseAny
              .from('musicas')
              .select('*')
              .eq('genero', topGenre)
              .limit(20)
            
            if (genreMusics) {
              const newRecommendations = genreMusics.filter((m: Musica) => !userMusicIds.has(m.id))
              recommendedIds = newRecommendations.slice(0, 12).map((m: Musica) => m.id)
            }
          }
        }
      }
      
      // Se não tiver recomendações, pega músicas aleatórias
      if (recommendedIds.length === 0) {
        const shuffled = [...musicas].sort(() => 0.5 - Math.random())
        recommendedIds = shuffled.slice(0, 12).map((m: Musica) => m.id)
      }
      
      const recommended = musicas.filter((m: Musica) => recommendedIds.includes(m.id))
      setRecommendations(recommended.slice(0, 12))
      
      // Buscar favoritos do usuário
      if (user?.id) {
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

  const handleRefreshRecommendations = () => {
    fetchAllData()
  }

  const handleGlobalShuffle = async () => {
    if (!isGlobalShuffle) {
      // Ativar modo aleatório global e tocar uma música aleatória
      await toggleGlobalShuffle()
      await playRandomSong()
    } else {
      toggleGlobalShuffle()
    }
  }

  const currentFeatured = featuredSongs[currentFeaturedIndex]

  return (
    <div className="space-y-10 md:space-y-12 animate-fade-in pb-20">
      
      {/* HERO SECTION - DESTAQUE DA SEMANA COM CARROSSEL */}
      {currentFeatured && (
        <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden group">
          {/* Background Image com overlay */}
          <div className="absolute inset-0">
            {currentFeatured.url_capa ? (
              <>
                <Image
                  src={currentFeatured.url_capa}
                  alt={currentFeatured.titulo}
                  fill
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 animate-gradient bg-[length:200%_200%]" />
            )}
          </div>
          
          {/* Conteúdo */}
          <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
            <div className="animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1">
                  <Flame size={12} className="text-white" />
                </div>
                <span className="text-xs font-medium text-white/80">Destaque da Semana</span>
                {featuredSongs.length > 1 && (
                  <span className="text-xs text-white/40 ml-2">
                    {currentFeaturedIndex + 1}/{featuredSongs.length}
                  </span>
                )}
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {currentFeatured.titulo}
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-4 drop-shadow-lg">
                {currentFeatured.artista}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentSong(currentFeatured, featuredSongs)}
                  className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                >
                  <Play size={18} fill="black" />
                  Ouvir Agora
                </button>
                
                <button
                  onClick={handleGlobalShuffle}
                  className={`px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl ${
                    isGlobalShuffle
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                  }`}
                >
                  <Radio size={18} />
                  {isGlobalShuffle ? 'Modo Aleatório Ativo' : 'Modo Aleatório'}
                </button>
                
                {featuredSongs.length > 1 && (
                  <div className="flex gap-1 items-center ml-2">
                    {featuredSongs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentFeaturedIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentFeaturedIndex 
                            ? 'w-8 bg-white' 
                            : 'w-4 bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO DE FAVORITOS */}
      {favorites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20">
                <Heart size={20} className="text-pink-400" fill="currentColor" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Suas Curtidas</h2>
            </div>
            <button 
              onClick={() => window.location.href = '/favorites'}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Ver todas →
            </button>
          </div>
          <MusicGrid musicas={favorites.slice(0, 6)} loading={loading} />
        </section>
      )}

      {/* SEÇÃO TOP DA SEMANA */}
      {weeklyTop.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
              <Trophy size={20} className="text-yellow-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Top da Semana</h2>
            <span className="text-xs text-gray-500">Mais ouvidos</span>
          </div>
          <MusicGrid musicas={weeklyTop} loading={loading} variant="compact" />
        </section>
      )}

      {/* SEÇÃO RECOMENDAÇÕES PERSONALIZADAS */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {user ? 'Recomendadas para Você' : 'Músicas em Alta'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGlobalShuffle}
              className={`flex items-center gap-1 text-sm transition-colors group ${
                isGlobalShuffle ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'
              }`}
              title="Modo aleatório global"
            >
              <Radio size={14} className="group-hover:scale-110 transition-transform" />
              <span>Rádio</span>
            </button>
            <button 
              onClick={handleRefreshRecommendations}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors group"
              title="Atualizar recomendações"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
        
        {recommendations.length > 0 ? (
          <MusicGrid musicas={recommendations} loading={loading} />
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Sparkles size={32} className="text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">
              {user 
                ? 'Toque algumas músicas para receber recomendações personalizadas!' 
                : 'Faça login para receber recomendações personalizadas!'}
            </p>
          </div>
        )}
      </section>

      {/* SEÇÃO LANÇAMENTOS */}
      {recentSongs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
              <Calendar size={20} className="text-green-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Lançamentos</h2>
          </div>
          <MusicGrid musicas={recentSongs} loading={loading} />
        </section>
      )}

      {/* CALL TO ACTION */}
      <div className="glass rounded-2xl p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Headphones size={32} className="text-white" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          Descubra novas músicas
        </h3>
        <p className="text-gray-400 mb-4 max-w-md mx-auto">
          Explore nossa biblioteca e encontre suas próximas músicas favoritas
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button 
            onClick={() => window.location.href = '/explore'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-lg"
          >
            Explorar Agora
          </button>
          <button 
            onClick={handleGlobalShuffle}
            className={`px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-lg ${
              isGlobalShuffle
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
            }`}
          >
            <Radio size={18} />
            {isGlobalShuffle ? 'Modo Aleatório Ativo' : 'Ouvir em Modo Aleatório'}
          </button>
        </div>
      </div>
    </div>
  )
}