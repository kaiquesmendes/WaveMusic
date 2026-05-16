import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const historyService = {
  async addToHistory(userId: string, musicaId: string): Promise<void> {
    const { error } = await supabase
      .from('historico')
      .insert({ usuario_id: userId, musica_id: musicaId, played_at: new Date().toISOString() })
    
    if (error) throw error
  },

  async getUserHistory(userId: string, limit: number = 50): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('historico')
      .select('musica:*')
      .eq('usuario_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data?.map(item => item.musica as unknown as Musica) || []
  },

  async clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('historico')
      .delete()
      .eq('usuario_id', userId)
    
    if (error) throw error
  }
}