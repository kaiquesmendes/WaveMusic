import { create } from 'zustand'
import { Musica } from '@/types'

interface MusicState {
  musicas: Musica[]
  recentMusics: Musica[]
  favorites: string[]
  loading: boolean
  setMusicas: (musicas: Musica[]) => void
  setRecentMusics: (musicas: Musica[]) => void
  setFavorites: (favorites: string[]) => void
  setLoading: (loading: boolean) => void
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
}

export const useMusicStore = create<MusicState>((set) => ({
  musicas: [],
  recentMusics: [],
  favorites: [],
  loading: false,
  setMusicas: (musicas) => set({ musicas }),
  setRecentMusics: (recentMusics) => set({ recentMusics }),
  setFavorites: (favorites) => set({ favorites }),
  setLoading: (loading) => set({ loading }),
  addFavorite: (id) => set((state) => ({ favorites: [...state.favorites, id] })),
  removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter(f => f !== id) })),
}))