import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const historyService = {
  async addToHistory(userId: string, musicaId: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('historico')
      .insert({ usuario_id: userId, musica_id: musicaId, played_at: new Date().toISOString() })
    
    if (error) throw error
  },

  async getUserHistory(userId: string, limit: number = 50): Promise<Musica[]> {
    const supabaseAny = supabase as any
    
    // Primeiro buscar os IDs do histórico
    const { data: historyData, error: historyError } = await supabaseAny
      .from('historico')
      .select('musica_id')
      .eq('usuario_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit)
    
    if (historyError) throw historyError
    
    if (!historyData || historyData.length === 0) return []
    
    // Buscar os detalhes das músicas
    const musicasIds = historyData.map((item: any) => item.musica_id)
    const { data: musicasData, error: musicasError } = await supabaseAny
      .from('musicas')
      .select('*')
      .in('id', musicasIds)
    
    if (musicasError) throw musicasError
    
    // Manter a ordem correta
    const orderedMusicas = musicasIds
      .map((id: string) => musicasData?.find((m: any) => m.id === id))
      .filter(Boolean) as Musica[]
    
    return orderedMusicas
  },

  async clearHistory(userId: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { error } = await supabaseAny
      .from('historico')
      .delete()
      .eq('usuario_id', userId)
    
    if (error) throw error
  }
}