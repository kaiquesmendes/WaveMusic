'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  async function fetchFavorites() {
    const { data } = await supabase
      .from('favoritos')
      .select('musica_id')
      .eq('usuario_id', user?.id)
    
    if (data) {
      setFavorites(data.map(f => f.musica_id))
    }
    setLoading(false)
  }

  async function toggleFavorite(musicaId: string) {
    if (!user) return

    const isFavorite = favorites.includes(musicaId)
    
    if (isFavorite) {
      await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', user.id)
        .eq('musica_id', musicaId)
      
      setFavorites(prev => prev.filter(id => id !== musicaId))
    } else {
      await supabase
        .from('favoritos')
        .insert({ usuario_id: user.id, musica_id: musicaId })
      
      setFavorites(prev => [...prev, musicaId])
    }
  }

  return { favorites, loading, toggleFavorite, refetch: fetchFavorites }
}