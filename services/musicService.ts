import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export const musicService = {
  // Busca a biblioteca inteira. O Supabase devolve no máximo 1000 linhas por
  // consulta, então paginamos (com ordem estável) para não perder músicas.
  async getAll(): Promise<Musica[]> {
    const supabaseAny = supabase as any
    const pageSize = 1000
    const all: Musica[] = []

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabaseAny
        .from('musicas')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) throw error
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < pageSize) break
    }

    return all
  },

  async getById(id: string): Promise<Musica | null> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('musicas')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async search(query: string): Promise<Musica[]> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('musicas')
      .select('*')
      .or(`titulo.ilike.%${query}%,artista.ilike.%${query}%`)
      .limit(50)
    
    if (error) throw error
    return data || []
  },

  async getByGenre(genero: string): Promise<Musica[]> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('musicas')
      .select('*')
      .eq('genero', genero)
    
    if (error) throw error
    return data || []
  },

  async getRecent(limit: number = 10): Promise<Musica[]> {
    const supabaseAny = supabase as any
    
    const { data, error } = await supabaseAny
      .from('musicas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
}