import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  isPlayerExpanded: boolean
  currentModal: string | null
  setIsSidebarOpen: (isOpen: boolean) => void
  setIsPlayerExpanded: (isExpanded: boolean) => void
  openModal: (modal: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isPlayerExpanded: false,
  currentModal: null,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setIsPlayerExpanded: (isExpanded) => set({ isPlayerExpanded: isExpanded }),
  openModal: (modal) => set({ currentModal: modal }),
  closeModal: () => set({ currentModal: null }),
}))