import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const musicService = {
  async getAll(): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Musica | null> {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async search(query: string): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .or(`titulo.ilike.%${query}%,artista.ilike.%${query}%`)
      .limit(50)
    
    if (error) throw error
    return data || []
  },

  async getByGenre(genero: string): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .eq('genero', genero)
    
    if (error) throw error
    return data || []
  },

  async getRecent(limit: number = 10): Promise<Musica[]> {
    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
}