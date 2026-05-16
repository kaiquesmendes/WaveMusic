'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Musica } from '@/types'

export function useSearch() {
  const [results, setResults] = useState<Musica[]>([])
  const [loading, setLoading] = useState(false)

  async function search(query: string) {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('musicas')
      .select('*')
      .or(`titulo.ilike.%${query}%,artista.ilike.%${query}%`)
      .limit(20)
    
    if (data) {
      setResults(data)
    }
    setLoading(false)
  }

  return { results, loading, search }
}