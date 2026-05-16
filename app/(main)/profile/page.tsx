'use client'

import { useEffect, useState, useRef } from 'react'
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
  Camera,
  LogOut,
  ChevronRight,
  Trophy,
  Mic2,
  Disc3,
  Star
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, userData, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [nome, setNome] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ 
    playlists: 0, 
    favorites: 0, 
    history: 0,
    totalMinutes: 0,
    totalHours: 0,
    topGenre: '',
    favoriteArtist: '',
    listeningLevel: ''
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topMusics, setTopMusics] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (userData) {
      setNome(userData.nome || '')
      setAvatarUrl(userData.avatar_url || '')
    }
    if (user) {
      fetchStats()
      fetchRecentActivity()
      fetchTopMusics()
    }
  }, [userData, user])

  async function fetchStats() {
    if (!user) return

    const [playlistsCount, favoritesCount, historyCount] = await Promise.all([
      supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
      supabase.from('favoritos').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
      supabase.from('historico').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
    ])

    const { data: historyData } = await supabase
      .from('historico')
      .select(`
        musica:musica_id (*)
      `)
      .eq('usuario_id', user.id)
      .limit(200)

    const musicas = historyData?.map(item => (item as any).musica).filter(Boolean) || []
    
    const totalSeconds = musicas.reduce((acc: number, m: any) => acc + (m.duracao || 0), 0)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)
    
    const genreCount: Record<string, number> = {}
    const artistCount: Record<string, number> = {}
    musicas.forEach((m: any) => {
      if (m.genero) genreCount[m.genero] = (genreCount[m.genero] || 0) + 1
      if (m.artista) artistCount[m.artista] = (artistCount[m.artista] || 0) + 1
    })
    
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ainda não definido'
    const favoriteArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ainda não definido'
    
    let listeningLevel = 'Iniciante'
    if (totalHours >= 100) listeningLevel = 'Lendário 🏆'
    else if (totalHours >= 50) listeningLevel = 'Expert 🎖️'
    else if (totalHours >= 20) listeningLevel = 'Avançado 🌟'
    else if (totalHours >= 5) listeningLevel = 'Intermediário 🎵'
    else if (totalHours >= 1) listeningLevel = 'Aprendiz 🎧'

    setStats({
      playlists: playlistsCount.count || 0,
      favorites: favoritesCount.count || 0,
      history: historyCount.count || 0,
      totalMinutes,
      totalHours,
      topGenre,
      favoriteArtist,
      listeningLevel
    })
  }

  async function fetchRecentActivity() {
    if (!user) return

    const { data } = await supabase
      .from('historico')
      .select(`
        musica:musica_id (*),
        played_at
      `)
      .eq('usuario_id', user.id)
      .order('played_at', { ascending: false })
      .limit(6)

    if (data && data.length > 0) {
      const activities = []
      for (const item of data) {
        const musicaData = (item as any).musica
        if (musicaData) {
          activities.push({
            musica: musicaData,
            played_at: (item as any).played_at
          })
        }
      }
      setRecentActivities(activities)
    }
  }

  async function fetchTopMusics() {
    if (!user) return

    const { data } = await supabase
      .from('historico')
      .select(`
        musica:musica_id (*)
      `)
      .eq('usuario_id', user.id)
      .limit(100)

    if (data && data.length > 0) {
      const musicCount: Record<string, any> = {}
      for (const item of data) {
        const musica = (item as any).musica
        if (musica && musica.id) {
          if (!musicCount[musica.id]) {
            musicCount[musica.id] = { ...musica, count: 0 }
          }
          musicCount[musica.id].count++
        }
      }
      const top3 = Object.values(musicCount).sort((a: any, b: any) => b.count - a.count).slice(0, 3)
      setTopMusics(top3)
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (!updateError) {
      setAvatarUrl(publicUrl)
      await refreshUser()
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)

    const { error } = await supabase
      .from('usuarios')
      .update({ 
        nome, 
        avatar_url: avatarUrl, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)

    if (!error) {
      await refreshUser()
      setIsEditing(false)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Hero Section Premium */}
      <div className="relative h-80 rounded-2xl overflow-hidden mb-24 group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 animate-gradient bg-[length:200%_200%]" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-500" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-white mx-auto mb-2" />
            <p className="text-white font-medium">Nível: {stats.listeningLevel}</p>
          </div>
        </div>
        
        {/* Avatar Container */}
        <div className="absolute -bottom-16 left-8 md:left-12">
          <div className="relative group/avatar">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-2xl transition-all duration-300 group-hover/avatar:scale-105">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={nome} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User size={48} className="text-white" />
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black transition-all duration-300 hover:scale-110"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
          <Headphones size={80} />
        </div>
        <div className="absolute bottom-4 left-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <Music size={60} />
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="ml-36 md:ml-44">
            {isEditing ? (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-purple-500 transition-all"
                placeholder="Seu nome"
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                {nome || user?.email?.split('@')[0]}
                {stats.totalHours >= 50 && <Trophy size={20} className="text-yellow-400" />}
              </h1>
            )}
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <Shield size={14} />
              Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Edit2 size={16} />
                Editar Perfil
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full transition-all duration-300"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-full hover:opacity-90 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards Premium */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<ListMusic size={24} />}
            value={stats.playlists}
            label="Playlists"
            color="purple"
            onClick={() => router.push('/library')}
          />
          <StatCard 
            icon={<Heart size={24} />}
            value={stats.favorites}
            label="Curtidas"
            color="pink"
            onClick={() => router.push('/favorites')}
          />
          <StatCard 
            icon={<Headphones size={24} />}
            value={stats.history}
            label="Músicas Ouvidas"
            color="green"
          />
          <StatCard 
            icon={<Clock size={24} />}
            value={stats.totalHours}
            label="Horas Ouvidas"
            color="orange"
            suffix="h"
          />
        </div>

        {/* Music Taste Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
              <h3 className="text-lg font-semibold text-white">Gênero Favorito</h3>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <Disc3 size={24} />
              {stats.topGenre}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group">
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
              <h3 className="text-lg font-semibold text-white">Artista Favorito</h3>
            </div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Mic2 size={24} />
              {stats.favoriteArtist}
            </div>
          </div>
        </div>

        {/* Top Músicas Mais Ouvidas */}
        {topMusics.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy size={20} className="text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Top 3 Músicas Mais Ouvidas</h3>
            </div>
            <div className="space-y-3">
              {topMusics.map((musica, index) => (
                <div key={musica.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="text-2xl font-bold text-gray-500 w-8">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                    {musica.url_capa ? (
                      <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Music size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{musica.titulo}</p>
                    <p className="text-gray-400 text-xs">{musica.artista}</p>
                  </div>
                  <div className="text-gray-500 text-xs flex items-center gap-1">
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
                <Clock size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Atividade Recente</h3>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const musica = activity.musica
                if (!musica) return null
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                      {musica.url_capa ? (
                        <Image src={musica.url_capa} alt={musica.titulo} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{musica.titulo}</p>
                      <p className="text-gray-400 text-xs">{musica.artista}</p>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.played_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Email Section */}
        <div className="glass rounded-2xl p-6 transition-all duration-300">
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

function StatCard({ icon, value, label, color, onClick, suffix = '' }: any) {
  const colors = {
    purple: 'bg-purple-500/20 group-hover:bg-purple-500/30 text-purple-400',
    pink: 'bg-pink-500/20 group-hover:bg-pink-500/30 text-pink-400',
    green: 'bg-green-500/20 group-hover:bg-green-500/30 text-green-400',
    orange: 'bg-orange-500/20 group-hover:bg-orange-500/30 text-orange-400'
  }

  return (
    <div 
      className="glass rounded-2xl p-5 text-center group hover:scale-105 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}{suffix}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}