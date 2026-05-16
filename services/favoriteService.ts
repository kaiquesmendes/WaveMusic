import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const favoriteService = {
  async getUserFavorites(userId: string): Promise<Musica[]> {
    // Usar any para evitar erro de tipo
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('favoritos')
      .select('musica_id')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (!data || data.length === 0) return []
    
    // Buscar os detalhes das músicas
    const musicasIds = data.map((item: any) => item.musica_id)
    const { data: musicasData, error: musicasError } = await supabaseAny
      .from('musicas')
      .select('*')
      .in('id', musicasIds)
    
    if (musicasError) throw musicasError
    
    // Manter a ordem original
    const orderedMusicas = musicasIds
      .map((id: string) => musicasData?.find((m: any) => m.id === id))
      .filter(Boolean) as Musica[]
    
    return orderedMusicas
  },

  async isFavorite(userId: string, musicaId: string): Promise<boolean> {
    const supabaseAny = supabase as any
    
    const { count, error } = await supabaseAny
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('musica_id', musicaId)
    
    if (error) throw error
    return (count || 0) > 0
  },

  async addFavorite(userId: string, musicaId: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('favoritos')
      .insert({ usuario_id: userId, musica_id: musicaId })
    
    if (error) throw error
  },

  async removeFavorite(userId: string, musicaId: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
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