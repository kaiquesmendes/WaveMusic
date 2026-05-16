'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { Playlist } from '@/types'

export function usePlaylists() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchPlaylists()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchPlaylists() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('playlists')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar playlists:', error)
      setLoading(false)
      return
    }
    
    if (data) {
      setPlaylists(data)
    }
    setLoading(false)
  }

  async function createPlaylist(nome: string, descricao?: string) {
    if (!user) return null

    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('playlists')
      .insert({
        nome,
        descricao: descricao || null,
        usuario_id: user.id,
      })
      .select()
      .single()

    if (!error && data) {
      setPlaylists(prev => [data, ...prev])
      return data
    }
    return null
  }

  async function deletePlaylist(id: string) {
    if (!user) return

    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id)

    if (!error) {
      setPlaylists(prev => prev.filter(p => p.id !== id))
    }
  }

  return { playlists, loading, createPlaylist, deletePlaylist, refetch: fetchPlaylists }
}