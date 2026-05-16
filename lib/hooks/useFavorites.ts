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
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchFavorites() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('favoritos')
      .select('musica_id')
      .eq('usuario_id', user.id)

    if (error) {
      console.error('Erro ao buscar favoritos:', error)
      setLoading(false)
      return
    }
    
    if (data && data.length > 0) {
      const musicasIds = data.map((f: any) => f.musica_id)
      setFavorites(musicasIds)
    } else {
      setFavorites([])
    }
    setLoading(false)
  }

  async function toggleFavorite(musicaId: string) {
    if (!user) return

    const isFavorite = favorites.includes(musicaId)
    
    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    if (isFavorite) {
      const { error } = await supabaseAny
        .from('favoritos')
        .delete()
        .eq('usuario_id', user.id)
        .eq('musica_id', musicaId)
      
      if (!error) {
        setFavorites(prev => prev.filter(id => id !== musicaId))
      }
    } else {
      const { error } = await supabaseAny
        .from('favoritos')
        .insert({ usuario_id: user.id, musica_id: musicaId })
      
      if (!error) {
        setFavorites(prev => [...prev, musicaId])
      }
    }
  }

  return { favorites, loading, toggleFavorite, refetch: fetchFavorites }
}