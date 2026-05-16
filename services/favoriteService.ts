import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const favoriteService = {
  async getUserFavorites(userId: string): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('favoritos')
      .select('musica:*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data?.map(item => item.musica as unknown as Musica) || []
  },

  async isFavorite(userId: string, musicaId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('musica_id', musicaId)
    
    if (error) throw error
    return (count || 0) > 0
  },

  async addFavorite(userId: string, musicaId: string): Promise<void> {
    const { error } = await supabase
      .from('favoritos')
      .insert({ usuario_id: userId, musica_id: musicaId })
    
    if (error) throw error
  },

  async removeFavorite(userId: string, musicaId: string): Promise<void> {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_id', userId)
      .eq('musica_id', musicaId)
    
    if (error) throw error
  },

  async toggleFavorite(userId: string, musicaId: string): Promise<boolean> {
    const isFav = await this.isFavorite(userId, musicaId)
    
    if (isFav) {
      await this.removeFavorite(userId, musicaId)
      return false
    } else {
      await this.addFavorite(userId, musicaId)
      return true
    }
  }
}