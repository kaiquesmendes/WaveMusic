import { supabase } from '@/lib/supabase/client'
import { Playlist, Musica } from '@/types'

export const playlistService = {
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('playlists')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getPlaylistById(id: string): Promise<Playlist | null> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getPlaylistMusics(playlistId: string): Promise<Musica[]> {
    const supabaseAny = supabase as any
    
    // Primeiro buscar os IDs das músicas na playlist
    const { data: playlistMusicas, error: playlistError } = await supabaseAny
      .from('playlist_musicas')
      .select('musica_id, ordem')
      .eq('playlist_id', playlistId)
      .order('ordem', { ascending: true })
    
    if (playlistError) throw playlistError
    
    if (!playlistMusicas || playlistMusicas.length === 0) return []
    
    // Buscar os detalhes das músicas
    const musicasIds = playlistMusicas.map((item: any) => item.musica_id)
    const { data: musicasData, error: musicasError } = await supabaseAny
      .from('musicas')
      .select('*')
      .in('id', musicasIds)
    
    if (musicasError) throw musicasError
    
    // Manter a ordem correta
    const orderedMusicas = playlistMusicas
      .map((pm: any) => musicasData?.find((m: any) => m.id === pm.musica_id))
      .filter(Boolean) as Musica[]
    
    return orderedMusicas
  },

  async createPlaylist(nome: string, usuarioId: string, descricao?: string): Promise<Playlist | null> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('playlists')
      .insert({ nome, descricao: descricao || null, usuario_id: usuarioId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async addMusicToPlaylist(playlistId: string, musicaId: string, ordem?: number): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('playlist_musicas')
      .insert({ playlist_id: playlistId, musica_id: musicaId, ordem: ordem || 0 })
    
    if (error) throw error
  },

  async removeMusicFromPlaylist(playlistId: string, musicaId: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('playlist_musicas')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('musica_id', musicaId)
    
    if (error) throw error
  },

  async deletePlaylist(id: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('playlists')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}