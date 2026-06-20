'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  User, 
  Mail, 
  Calendar, 
  Edit2, 
  Save, 
  X, 
  Music, 
  Heart, 
  Clock, 
  Shield,
  Headphones,
  Sparkles,
  LogOut,
  ChevronRight,
  Trophy,
  Mic2,
  Disc3,
  Star,
  Activity,
  TrendingUp,
  Award,
  Palette
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Cache do perfil
const profileCache = {
  data: null as any,
  timestamp: 0,
  expiryTime: 3 * 60 * 1000, // 3 minutos
  isValid: () => Date.now() - profileCache.timestamp < profileCache.expiryTime
}

export default function ProfilePage() {
  const { user, userData, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [nome, setNome] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState({ 
    playlists: 0, 
    favorites: 0, 
    history: 0,
    totalMinutes: 0,
    totalHours: 0,
    totalSongs: 0,
    topGenre: '',
    topGenreCount: 0,
    favoriteArtist: '',
    favoriteArtistCount: 0,
    favoriteSong: '',
    favoriteSongCount: 0,
    listeningLevel: '',
    levelProgress: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topMusics, setTopMusics] = useState<any[]>([])
  const [bannerImage, setBannerImage] = useState('')
  const router = useRouter()
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)

  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!user) return

    // Usar cache se válido
    if (!forceRefresh && profileCache.isValid() && profileCache.data) {
      setStats(profileCache.data.stats)
      setBannerImage(profileCache.data.bannerImage)
      setRecentActivities(profileCache.data.recentActivities || [])
      setTopMusics(profileCache.data.topMusics || [])
      setLoading(false)
      return
    }

    if (isFetchingRef.current) return
    isFetchingRef.current = true

    const supabaseAny = supabase as any

    try {
      // Executar queries em paralelo
      const [playlistsCount, favoritesCount, historyCount, historyData] = await Promise.all([
        supabaseAny.from('playlists').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
        supabaseAny.from('favoritos').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
        supabaseAny.from('historico').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
        supabaseAny
          .from('historico')
          .select(`
            musica:musica_id (*)
          `)
          .eq('usuario_id', user.id)
          .limit(500)
      ])

      const musicas = historyData?.data?.map((item: any) => item.musica).filter(Boolean) || []
      
      const totalSeconds = musicas.reduce((acc: number, m: any) => acc + (m.duracao || 0), 0)
      const totalMinutes = Math.floor(totalSeconds / 60)
      const totalHours = Math.floor(totalMinutes / 60)
      const totalSongs = musicas.length

      const genreCount: Record<string, number> = {}
      const artistCount: Record<string, number> = {}
      const songCount: Record<string, { count: number; song: any }> = {}
      
      musicas.forEach((m: any) => {
        if (m.genero && m.genero !== 'null' && m.genero !== '') {
          genreCount[m.genero] = (genreCount[m.genero] || 0) + 1
        }
        if (m.artista && m.artista !== 'null' && m.artista !== '') {
          artistCount[m.artista] = (artistCount[m.artista] || 0) + 1
        }
        if (m.id) {
          if (!songCount[m.id]) {
            songCount[m.id] = { count: 0, song: m }
          }
          songCount[m.id].count++
        }
      })
      
      const topGenreEntry = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]
      const topArtistEntry = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]
      const topSongEntry = Object.values(songCount).sort((a, b) => b.count - a.count)[0]
      
      const topGenre = topGenreEntry?.[0] || 'Nenhum ainda'
      const topGenreCount = topGenreEntry?.[1] || 0
      const favoriteArtist = topArtistEntry?.[0] || 'Nenhum ainda'
      const favoriteArtistCount = topArtistEntry?.[1] || 0
      const favoriteSong = topSongEntry?.song?.titulo || 'Nenhuma ainda'
      const favoriteSongCount = topSongEntry?.count || 0
      
      // Buscar banner do artista favorito
      let bannerUrl = ''
      if (favoriteArtist !== 'Nenhum ainda') {
        const { data: artistaMusica } = await supabaseAny
          .from('musicas')
          .select('url_capa')
          .eq('artista', favoriteArtist)
          .not('url_capa', 'is', null)
          .limit(1)
        bannerUrl = artistaMusica?.[0]?.url_capa || ''
      }
      
      // Calcular nível
      let listeningLevel = 'Iniciante'
      let levelProgress = 0
      
      if (totalHours >= 100) {
        listeningLevel = 'Lendário 🏆'
        levelProgress = 100
      } else if (totalHours >= 50) {
        listeningLevel = 'Expert 🎖️'
        levelProgress = ((totalHours - 50) / 50) * 100
      } else if (totalHours >= 20) {
        listeningLevel = 'Avançado 🌟'
        levelProgress = ((totalHours - 20) / 30) * 100
      } else if (totalHours >= 5) {
        listeningLevel = 'Intermediário 🎵'
        levelProgress = ((totalHours - 5) / 15) * 100
      } else if (totalHours > 0) {
        listeningLevel = 'Aprendiz 🎧'
        levelProgress = (totalHours / 5) * 100
      } else {
        levelProgress = 0
      }
      
      levelProgress = Math.min(Math.max(levelProgress, 0), 100)

      const newStats = {
        playlists: playlistsCount.count || 0,
        favorites: favoritesCount.count || 0,
        history: historyCount.count || 0,
        totalMinutes,
        totalHours,
        totalSongs,
        topGenre,
        topGenreCount,
        favoriteArtist,
        favoriteArtistCount,
        favoriteSong,
        favoriteSongCount,
        listeningLevel,
        levelProgress
      }

      // Buscar atividades recentes e top músicas
      const { data: recentData } = await supabaseAny
        .from('historico')
        .select(`
          musica:musica_id (*),
          played_at
        `)
        .eq('usuario_id', user.id)
        .order('played_at', { ascending: false })
        .limit(10)

      let activities = []
      if (recentData && recentData.length > 0) {
        for (const item of recentData) {
          const musicaData = item.musica
          if (musicaData) {
            activities.push({
              musica: musicaData,
              played_at: item.played_at
            })
          }
        }
      }

      // Buscar top músicas
      const { data: topData } = await supabaseAny
        .from('historico')
        .select(`
          musica:musica_id (*)
        `)
        .eq('usuario_id', user.id)
        .limit(200)

      let top5: any[] = []
      if (topData && topData.length > 0) {
        const musicCount: Record<string, any> = {}
        for (const item of topData) {
          const musica = item.musica
          if (musica && musica.id) {
            if (!musicCount[musica.id]) {
              musicCount[musica.id] = { ...musica, count: 0 }
            }
            musicCount[musica.id].count++
          }
        }
        top5 = Object.values(musicCount).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
      }

      // Salvar no cache
      profileCache.data = {
        stats: newStats,
        bannerImage: bannerUrl,
        recentActivities: activities,
        topMusics: top5
      }
      profileCache.timestamp = Date.now()

      if (isMountedRef.current) {
        setStats(newStats)
        setBannerImage(bannerUrl)
        setRecentActivities(activities)
        setTopMusics(top5)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      if (isMountedRef.current) setLoading(false)
      isFetchingRef.current = false
    }
  }, [user])

  // Buscar atividades recentes
  const fetchRecentActivity = useCallback(async () => {
    if (!user) return

    const supabaseAny = supabase as any
    
    const { data } = await supabaseAny
      .from('historico')
      .select(`
        musica:musica_id (*),
        played_at
      `)
      .eq('usuario_id', user.id)
      .order('played_at', { ascending: false })
      .limit(10)

    if (data && data.length > 0 && isMountedRef.current) {
      const activities = []
      for (const item of data) {
        const musicaData = item.musica
        if (musicaData) {
          activities.push({
            musica: musicaData,
            played_at: item.played_at
          })
        }
      }
      setRecentActivities(activities)
    }
  }, [user])

  // Buscar top músicas
  const fetchTopMusics = useCallback(async () => {
    if (!user) return

    const supabaseAny = supabase as any
    
    const { data } = await supabaseAny
      .from('historico')
      .select(`
        musica:musica_id (*)
      `)
      .eq('usuario_id', user.id)
      .limit(200)

    if (data && data.length > 0 && isMountedRef.current) {
      const musicCount: Record<string, any> = {}
      for (const item of data) {
        const musica = item.musica
        if (musica && musica.id) {
          if (!musicCount[musica.id]) {
            musicCount[musica.id] = { ...musica, count: 0 }
          }
          musicCount[musica.id].count++
        }
      }
      const top5 = Object.values(musicCount).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
      setTopMusics(top5)
    }
  }, [user])

  useEffect(() => {
    isMountedRef.current = true
    fetchStats()
    
    return () => {
      isMountedRef.current = false
    }
  }, [fetchStats])

  // Carrega nome e bio salvos assim que os dados do usuário chegam
  // (antes disso os campos ficavam sempre vazios, mesmo com dados salvos)
  useEffect(() => {
    if (userData) {
      setNome(userData.nome || '')
      setBio(userData.bio || '')
    }
  }, [userData])

  const handleCancelEdit = useCallback(() => {
    setNome(userData?.nome || '')
    setBio(userData?.bio || '')
    setIsEditing(false)
  }, [userData])

  const handleSave = useCallback(async () => {
    if (!user) return
    setIsSaving(true)

    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('usuarios')
      .update({ 
        nome, 
        bio,
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)

    if (!error) {
      await refreshUser()
      setIsEditing(false)
      // Limpar cache para recarregar dados atualizados
      profileCache.data = null
      fetchStats(true)
    }
    setIsSaving(false)
  }, [user, nome, bio, refreshUser, fetchStats])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const getLevelColor = useCallback(() => {
    const level = stats.listeningLevel
    if (level.includes('Lendário')) return 'from-yellow-400 via-orange-500 to-red-500'
    if (level.includes('Expert')) return 'from-purple-400 via-pink-500 to-red-500'
    if (level.includes('Avançado')) return 'from-blue-400 via-cyan-500 to-teal-500'
    if (level.includes('Intermediário')) return 'from-green-400 via-emerald-500 to-teal-500'
    return 'from-gray-400 via-gray-500 to-gray-600'
  }, [stats.listeningLevel])

  // Memoizar componentes
  const heroSection = useMemo(() => (
    <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 group">
      <div className="absolute inset-0">
        {bannerImage ? (
          <>
            <Image
              src={bannerImage}
              alt="Banner"
              fill
              className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
              priority
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${getLevelColor()} opacity-60 mix-blend-overlay`} />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${getLevelColor()} animate-gradient bg-[length:200%_200%]`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>
      
      <div className="absolute top-4 right-4 glass-dark rounded-full px-4 py-2 flex items-center gap-2 z-10">
        <Award size={16} className="text-yellow-400" />
        <span className="text-sm font-medium text-white">{stats.listeningLevel}</span>
      </div>
      
      {stats.favoriteArtist !== 'Nenhum ainda' && (
        <div className="absolute bottom-4 left-4 glass-dark rounded-full px-3 py-1.5 flex items-center gap-2 z-10 backdrop-blur-md">
          <Mic2 size={12} className="text-purple-400" />
          <span className="text-xs text-white">Seu artista favorito: {stats.favoriteArtist}</span>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 glass-dark rounded-full px-3 py-1.5 flex items-center gap-2 z-10 backdrop-blur-md">
        <Headphones size={12} className="text-green-400" />
        <span className="text-xs text-white">{stats.totalHours} horas ouvidas</span>
      </div>
    </div>
  ), [bannerImage, getLevelColor, stats.listeningLevel, stats.favoriteArtist, stats.totalHours])

  const statsCards = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard 
        icon={<Heart size={22} />}
        value={stats.favorites}
        label="Curtidas"
        color="pink"
        onClick={() => router.push('/favorites')}
      />
      <StatCard 
        icon={<ListMusic size={22} />}
        value={stats.playlists}
        label="Playlists"
        color="purple"
        onClick={() => router.push('/library')}
      />
      <StatCard 
        icon={<Headphones size={22} />}
        value={stats.history}
        label="Músicas"
        color="green"
      />
      <StatCard 
        icon={<Clock size={22} />}
        value={stats.totalHours}
        label="Horas"
        color="orange"
        suffix="h"
      />
    </div>
  ), [stats, router])

  const musicTasteSection = useMemo(() => (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Disc3 size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Gênero Favorito</h3>
            <p className="text-xl font-bold text-white">{stats.topGenre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <TrendingUp size={14} />
          <span>{stats.topGenreCount} músicas ouvidas neste gênero</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Star size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Música Favorita</h3>
            <p className="text-lg font-bold text-white truncate max-w-[200px]">{stats.favoriteSong}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Headphones size={14} />
          <span>Ouvida {stats.favoriteSongCount} {stats.favoriteSongCount === 1 ? 'vez' : 'vezes'}</span>
        </div>
      </div>
    </div>
  ), [stats])

  // Estado de loading
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-white/10 rounded-2xl" />
        <div className="h-32 bg-white/10 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {heroSection}

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header Info */}
        <div className="text-center">
          {/* Avatar - sobrepõe a borda do banner, como em apps de música conhecidos */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto -mt-16 md:-mt-20 mb-4 rounded-full ring-4 ring-black overflow-hidden shadow-2xl">
            {userData?.avatar_url ? (
              <Image src={userData.avatar_url} alt={nome || 'Avatar'} fill className="object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getLevelColor()} flex items-center justify-center`}>
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {(nome || user?.email || 'U')[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-purple-500 transition-all"
              placeholder="Seu nome"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
              {nome || user?.email?.split('@')[0]}
              {stats.totalHours >= 50 && <Trophy size={20} className="text-yellow-400" />}
            </h1>
          )}
          <p className="text-gray-400 text-sm mt-2 flex items-center justify-center gap-2">
            <Shield size={14} />
            Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Level Progress Bar */}
        <div className="glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">
              {stats.listeningLevel.includes('Lendário') ? 'Você atingiu o nível máximo!' : 'Progresso para próximo nível'}
            </span>
            <span className="text-sm font-medium text-white">{Math.round(stats.levelProgress)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getLevelColor()} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
              style={{ width: `${stats.levelProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            🎵 {stats.totalSongs} músicas ouvidas • ⏱️ {stats.totalHours} horas • 💖 {stats.favorites} curtidas
          </p>
        </div>

        {statsCards}
        {musicTasteSection}

        {/* Top Músicas Mais Ouvidas */}
        {topMusics.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy size={20} className="text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Top 5 Músicas Mais Ouvidas</h3>
            </div>
            <div className="space-y-3">
              {topMusics.map((musica, index) => (
                <div key={musica.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="text-2xl font-bold text-gray-500 w-10">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                  </div>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {musica.url_capa ? (
                      <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Music size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{musica.titulo}</p>
                    <p className="text-gray-400 text-xs truncate">{musica.artista}</p>
                  </div>
                  <div className="text-gray-500 text-xs flex items-center gap-1 flex-shrink-0">
                    <Headphones size={12} />
                    {musica.count} {musica.count === 1 ? 'vez' : 'vezes'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Atividade Recente</h3>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </div>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => {
                const musica = activity.musica
                if (!musica) return null
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {musica.url_capa ? (
                        <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{musica.titulo}</p>
                      <p className="text-gray-400 text-xs truncate">{musica.artista}</p>
                    </div>
                    <p className="text-gray-500 text-xs flex-shrink-0">
                      {new Date(activity.played_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bio Section */}
        {isEditing ? (
          <div className="glass rounded-2xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Palette size={16} />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você e seus gostos musicais..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 transition-all resize-none text-white placeholder:text-gray-500"
            />
          </div>
        ) : bio && (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-gray-300 italic">"{bio}"</p>
          </div>
        )}

        {/* Email Section */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Mail size={18} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Informações da Conta</h3>
          </div>
          <div className="flex items-center gap-3 text-gray-300 pl-11">
            <Mail size={16} />
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Edit and Logout Buttons */}
        <div className="flex gap-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full glass rounded-2xl p-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          Sair da Conta
        </button>
      </div>
    </div>
  )
}

// Componentes auxiliares
function ListMusic(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function StatCard({ icon, value, label, color, onClick, suffix = '' }: { 
  icon: React.ReactNode, 
  value: number, 
  label: string, 
  color: string, 
  onClick?: () => void, 
  suffix?: string 
}) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    pink: 'from-pink-500/20 to-red-500/20 text-pink-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    orange: 'from-orange-500/20 to-amber-500/20 text-orange-400'
  }

  return (
    <div 
      className="glass rounded-2xl p-4 text-center group hover:scale-105 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}{suffix}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}