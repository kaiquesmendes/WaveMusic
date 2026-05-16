import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Usuario } from '@/types'

interface AuthState {
  user: User | null
  userData: Usuario | null
  loading: boolean
  setUser: (user: User | null) => void
  setUserData: (userData: Usuario | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (loading) => set({ loading }),
}))