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
    if (user) {
      fetchPlaylists()
    }
  }, [user])

  async function fetchPlaylists() {
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .eq('usuario_id', user?.id)
      .order('created_at', { ascending: false })
    
    if (data) {
      setPlaylists(data)
    }
    setLoading(false)
  }

  async function createPlaylist(nome: string, descricao?: string) {
    if (!user) return null

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        nome,
        descricao,
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
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user?.id)

    if (!error) {
      setPlaylists(prev => prev.filter(p => p.id !== id))
    }
  }

  return { playlists, loading, createPlaylist, deletePlaylist, refetch: fetchPlaylists }
}