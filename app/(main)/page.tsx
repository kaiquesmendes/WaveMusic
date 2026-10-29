'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { MusicGrid } from '@/components/Music/MusicGrid'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { Play, TrendingUp, Clock, Heart, Sparkles, Headphones, Calendar, Flame, Trophy, Radio } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'

// Cache de dados (evita requisições duplicadas)
const dataCache = {
  data: null as any,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000, // 5 minutos
  isValid: () => Date.now() - dataCache.timestamp < dataCache.expiryTime
}

export default function HomePage() {
  const [recentSongs, setRecentSongs] = useState<Musica[]>([])
  const [recommendations, setRecommendations] = useState<Musica[]>([])
  const [featuredSongs, setFeaturedSongs] = useState<Musica[]>([])
  const [weeklyTop, setWeeklyTop] = useState<Musica[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { setCurrentSong, toggleGlobalShuffle, isGlobalShuffle } = usePlayerStore()
  const { user } = useAuth()
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Detectar quando a página está visível (otimização de performance)
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Carregar dados com cache
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Se não for refresh e cache for válido, usar cache
    if (!forceRefresh && dataCache.isValid() && dataCache.data) {
      setRecentSongs(dataCache.data.recentSongs)
      setFeaturedSongs(dataCache.data.featuredSongs)
      setWeeklyTop(dataCache.data.weeklyTop)
      setRecommendations(dataCache.data.recommendations)
      setFavorites(dataCache.data.favorites || [])
      setLoading(false)
      return
    }

    setIsRefreshing(true)
    if (!forceRefresh) setLoading(true)
    
    const supabaseAny = supabase as any
    
    try {
      const { data: musicas, error } = await supabaseAny
        .from('musicas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) // Limitar para performance

      if (error) throw error

      if (musicas && musicas.length > 0) {
        // Lançamentos
        const recent = musicas.slice(0, 8)
        
        // Destaques (aleatório, mas estável entre renders)
        const shuffledForFeatured = [...musicas].sort(() => 0.5 - Math.random())
        const featured = shuffledForFeatured.slice(0, 5)
        
        // Top da Semana
        const shuffledForTop = [...musicas].sort(() => 0.5 - Math.random())
        const top = shuffledForTop.slice(0, 6)
        
        // Recomendações personalizadas
        let recommendedIds: string[] = []
        let userFavoritesList: Musica[] = []
        
        if (user?.id) {
          // Buscar favoritos e histórico em paralelo para melhor performance
          const [userFavorites, userHistory] = await Promise.all([
            supabaseAny
              .from('favoritos')
              .select('musica:musica_id(*)')
              .eq('usuario_id', user.id),
            supabaseAny
              .from('historico')
              .select('musica:musica_id(*)')
              .eq('usuario_id', user.id)
              .limit(30)
          ])
          
          const favoriteMusics = userFavorites?.data?.map((f: any) => f.musica) || []
          const historyMusics = userHistory?.data?.map((h: any) => h.musica) || []
          const allUserMusics = [...favoriteMusics, ...historyMusics].filter(Boolean)
          
          if (allUserMusics.length > 0) {
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
          
          // Favoritos para exibição
          if (favoriteMusics.length > 0) {
            userFavoritesList = favoriteMusics.slice(0, 6)
          }
        }
        
        // Recomendações fallback
        if (recommendedIds.length === 0) {
          const shuffled = [...musicas].sort(() => 0.5 - Math.random())
          recommendedIds = shuffled.slice(0, 12).map((m: Musica) => m.id)
        }
        
        const recommended = musicas.filter((m: Musica) => recommendedIds.includes(m.id))
        
        // Salvar no cache
        dataCache.data = {
          recentSongs: recent,
          featuredSongs: featured,
          weeklyTop: top,
          recommendations: recommended.slice(0, 12),
          favorites: userFavoritesList
        }
        dataCache.timestamp = Date.now()
        
        if (isMountedRef.current) {
          setRecentSongs(recent)
          setFeaturedSongs(featured)
          setWeeklyTop(top)
          setRecommendations(recommended.slice(0, 12))
          setFavorites(userFavoritesList)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar músicas:', error)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [user])

  // Carregar dados iniciais
  useEffect(() => {
    isMountedRef.current = true
    fetchAllData()
    
    return () => {
      isMountedRef.current = false
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
      }
    }
  }, [fetchAllData])

  // Carrossel de destaques (apenas quando página visível)
  useEffect(() => {
    if (featuredSongs.length <= 1 || !isPageVisible) return
    
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current)
    }
    
    carouselIntervalRef.current = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredSongs.length)
    }, 10000)
    
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
      }
    }
  }, [featuredSongs.length, isPageVisible])

  const handleRefreshRecommendations = useCallback(() => {
    fetchAllData(true) // Force refresh
  }, [fetchAllData])

  // Liga/desliga a "Rádio" (biblioteca inteira no aleatório)
  const handleGlobalShuffle = useCallback(() => {
    toggleGlobalShuffle()
  }, [toggleGlobalShuffle])

  const currentFeatured = featuredSongs[currentFeaturedIndex]

  // Memoizar componentes para evitar re-renders
  const heroSection = useMemo(() => {
    if (!currentFeatured) return null
    
    return (
      <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden group">
        <div className="absolute inset-0">
          {currentFeatured.url_capa ? (
            <>
              <Image
                src={currentFeatured.url_capa}
                alt={currentFeatured.titulo}
                fill
                className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                priority
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 animate-gradient bg-[length:200%_200%]" />
          )}
        </div>
        
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
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">
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
                      aria-label={`Ir para destaque ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }, [currentFeatured, featuredSongs, currentFeaturedIndex, isGlobalShuffle, handleGlobalShuffle, setCurrentSong])

  // Estado de loading
  if (loading) {
    return (
      <div className="space-y-10 md:space-y-12 animate-pulse">
        <div className="h-80 md:h-96 bg-white/10 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/10 aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 md:space-y-12 animate-fade-in pb-20">
      {heroSection}

      {/* Seção de Favoritos */}
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
          <MusicGrid musicas={favorites.slice(0, 6)} loading={false} />
        </section>
      )}

      {/* Seção Top da Semana */}
      {weeklyTop.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
              <Trophy size={20} className="text-yellow-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Top da Semana</h2>
            <span className="text-xs text-gray-500">Mais ouvidos</span>
          </div>
          <MusicGrid musicas={weeklyTop} loading={false} variant="compact" />
        </section>
      )}

      {/* Seção Recomendações */}
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
              disabled={isRefreshing}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors group disabled:opacity-50"
              title="Atualizar recomendações"
            >
              <div className={`w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
        
        {recommendations.length > 0 ? (
          <MusicGrid musicas={recommendations} loading={false} />
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

      {/* Seção Lançamentos */}
      {recentSongs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
              <Calendar size={20} className="text-green-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Lançamentos</h2>
          </div>
          <MusicGrid musicas={recentSongs} loading={false} />
        </section>
      )}

      {/* Call to Action */}
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