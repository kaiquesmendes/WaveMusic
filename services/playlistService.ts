import { supabase } from '@/lib/supabase/client'
import { Playlist, Musica } from '@/types'

export const playlistService = {
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getPlaylistById(id: string): Promise<Playlist | null> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getPlaylistMusics(playlistId: string): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('playlist_musicas')
      .select('musica:*')
      .eq('playlist_id', playlistId)
      .order('ordem', { ascending: true })
    
    if (error) throw error
    return data?.map(item => item.musica as unknown as Musica) || []
  },

  async createPlaylist(nome: string, usuarioId: string, descricao?: string): Promise<Playlist | null> {
    const { data, error } = await supabase
      .from('playlists')
      .insert({ nome, descricao, usuario_id: usuarioId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async addMusicToPlaylist(playlistId: string, musicaId: string, ordem?: number): Promise<void> {
    const { error } = await supabase
      .from('playlist_musicas')
      .insert({ playlist_id: playlistId, musica_id: musicaId, ordem: ordem || 0 })
    
    if (error) throw error
  },

  async removeMusicFromPlaylist(playlistId: string, musicaId: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_musicas')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('musica_id', musicaId)
    
    if (error) throw error
  },

  async deletePlaylist(id: string): Promise<void> {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}