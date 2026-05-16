'use client'

import { useEffect, useState } from 'react'
import { MusicList } from '@/components/Music/MusicList'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Musica } from '@/types'
import { Heart, Music } from 'lucide-react'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  async function fetchFavorites() {
    setLoading(true)
    const { data } = await supabase
      .from('favoritos')
      .select('musica:musica_id(*)')
      .eq('usuario_id', user?.id)
      .order('created_at', { ascending: false })

    if (data) {
      const musicas = data.map(item => item.musica as unknown as Musica)
      setFavorites(musicas.filter(m => m !== null))
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
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
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <Heart size={32} className="text-pink-400" fill="currentColor" />
        <div>
          <h1 className="text-3xl font-bold text-white">Músicas Curtidas</h1>
          <p className="text-gray-400 text-sm mt-1">{favorites.length} músicas</p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <MusicList musicas={favorites} showImage showAlbum />
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <Heart size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma música curtida</h3>
          <p className="text-gray-400">
            Comece a curtir suas músicas favoritas clicando no coração ♥
          </p>
        </div>
      )}
    </div>
  )
}