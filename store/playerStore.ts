import { create } from 'zustand'
import { Howl } from 'howler'
import { Musica } from '@/types'

interface PlayerState {
  currentSong: Musica | null
  isPlaying: boolean
  progress: number
  volume: number
  duration: number
  currentTime: number
  queue: Musica[]
  originalQueue: Musica[]
  allSongs: Musica[]
  currentIndex: number
  howl: Howl | null
  isShuffle: boolean
  isRepeat: boolean
  isGlobalShuffle: boolean
  
  setCurrentSong: (song: Musica, queue?: Musica[]) => void
  togglePlay: () => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
  seekTo: (position: number) => void
  nextSong: () => void
  previousSong: () => void
  updateTime: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleGlobalShuffle: () => void
  shuffleQueue: () => void
  loadAllSongs: () => Promise<void>
  playRandomSong: () => Promise<void>
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  volume: 70,
  duration: 0,
  currentTime: 0,
  queue: [],
  originalQueue: [],
  allSongs: [],
  currentIndex: -1,
  howl: null,
  isShuffle: false,
  isRepeat: false,
  isGlobalShuffle: false,

  loadAllSongs: async () => {
    const supabaseAny = (await import('@/lib/supabase/client')).supabase as any
    const { data } = await supabaseAny
      .from('musicas')
      .select('*')
    
    if (data && data.length > 0) {
      set({ allSongs: data })
    }
  },

  playRandomSong: async () => {
    const { allSongs, loadAllSongs } = get()
    
    if (allSongs.length === 0) {
      await loadAllSongs()
    }
    
    const currentAllSongs = get().allSongs
    if (currentAllSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentAllSongs.length)
      const randomSong = currentAllSongs[randomIndex]
      // Embaralhar o restante das músicas
      const otherSongs = currentAllSongs.filter((_, i) => i !== randomIndex)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const shuffledQueue = [randomSong, ...shuffledOthers]
      get().setCurrentSong(randomSong, shuffledQueue)
    }
  },

  toggleGlobalShuffle: () => {
    const { isGlobalShuffle, allSongs, loadAllSongs, setCurrentSong, currentSong } = get()
    const newState = !isGlobalShuffle
    
    if (newState && allSongs.length === 0) {
      loadAllSongs().then(() => {
        const currentAllSongs = get().allSongs
        if (currentAllSongs.length > 0 && currentSong) {
          // Manter a música atual e embaralhar as outras
          const otherSongs = currentAllSongs.filter(s => s.id !== currentSong.id)
          const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
          const newQueue = [currentSong, ...shuffledOthers]
          set({ 
            isGlobalShuffle: true, 
            queue: newQueue,
            originalQueue: newQueue,
            currentIndex: 0
          })
        } else if (currentAllSongs.length > 0) {
          // Se não tem música atual, tocar uma aleatória
          get().playRandomSong()
          set({ isGlobalShuffle: true })
        }
      })
    } else {
      set({ isGlobalShuffle: false })
    }
  },

  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue, currentSong, currentIndex } = get()
    const newShuffleState = !isShuffle
    
    if (newShuffleState) {
      const otherSongs = queue.filter((_, i) => i !== currentIndex)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const newQueue = [currentSong!, ...shuffledOthers]
      set({ 
        isShuffle: true, 
        queue: newQueue,
        originalQueue: queue,
        currentIndex: 0
      })
    } else {
      set({ 
        isShuffle: false, 
        queue: originalQueue,
        currentIndex: originalQueue.findIndex(s => s.id === currentSong?.id)
      })
    }
  },

  toggleRepeat: () => {
    set({ isRepeat: !get().isRepeat })
  },

  setCurrentSong: (song, queue = []) => {
    const { howl, isGlobalShuffle, allSongs } = get()
    if (howl) {
      howl.unload()
    }

    let finalQueue = queue.length ? queue : [song]
    
    // Se o modo aleatório global estiver ativo, garantir que a fila seja toda aleatória
    if (isGlobalShuffle && finalQueue.length === 1) {
      const otherSongs = allSongs.filter(s => s.id !== song.id)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      finalQueue = [song, ...shuffledOthers]
    }
    
    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      volume: get().volume / 100,
      onend: () => {
        const { isRepeat, currentIndex, queue: currentQueue, isGlobalShuffle, allSongs: globalSongs } = get()
        if (isRepeat) {
          get().seekTo(0)
          get().togglePlay()
        } else if (isGlobalShuffle && currentIndex + 1 >= currentQueue.length) {
          // Se acabou a fila no modo aleatório global, recriar a fila
          const remainingSongs = globalSongs.filter(s => s.id !== song.id)
          const shuffledRemaining = [...remainingSongs].sort(() => Math.random() - 0.5)
          const newGlobalQueue = [song, ...shuffledRemaining]
          set({ queue: newGlobalQueue, currentIndex: 0 })
          get().nextSong()
        } else {
          get().nextSong()
        }
      },
      onplay: () => {
        set({ isPlaying: true })
        requestAnimationFrame(() => get().updateTime())
      },
      onpause: () => {
        set({ isPlaying: false })
      },
      onload: () => {
        set({ duration: newHowl.duration() })
      }
    })

    set({
      currentSong: song,
      howl: newHowl,
      queue: finalQueue,
      originalQueue: finalQueue,
      currentIndex: 0,
      progress: 0,
      currentTime: 0,
      isShuffle: false
    })

    newHowl.play()
  },

  togglePlay: () => {
    const { howl, isPlaying } = get()
    if (!howl) return

    if (isPlaying) {
      howl.pause()
    } else {
      howl.play()
    }
    set({ isPlaying: !isPlaying })
  },

  setProgress: (progress) => {
    set({ progress })
  },

  setVolume: (volume) => {
    const { howl } = get()
    if (howl) {
      howl.volume(volume / 100)
    }
    set({ volume })
  },

  seekTo: (position) => {
    const { howl, duration } = get()
    if (howl) {
      howl.seek(position)
      set({ progress: (position / duration) * 100 })
    }
  },

  nextSong: () => {
    const { queue, currentIndex, setCurrentSong, isGlobalShuffle, allSongs, currentSong } = get()
    if (currentIndex + 1 < queue.length) {
      const nextSong = queue[currentIndex + 1]
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSong, queue)
    } else if (isGlobalShuffle && currentSong) {
      // Recriar fila aleatória quando chegar ao fim
      const otherSongs = allSongs.filter(s => s.id !== currentSong.id)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const newQueue = [currentSong, ...shuffledOthers]
      set({ queue: newQueue, currentIndex: 0 })
      if (newQueue.length > 1) {
        setCurrentSong(newQueue[1], newQueue)
      }
    }
  },

  previousSong: () => {
    const { queue, currentIndex, setCurrentSong } = get()
    if (currentIndex - 1 >= 0) {
      const prevSong = queue[currentIndex - 1]
      set({ currentIndex: currentIndex - 1 })
      setCurrentSong(prevSong, queue)
    }
  },

  updateTime: () => {
    const { howl, isPlaying } = get()
    if (howl && isPlaying) {
      const currentTime = howl.seek() as number
      const duration = howl.duration()
      const progress = (currentTime / duration) * 100
      set({ currentTime, progress })
      requestAnimationFrame(() => get().updateTime())
    }
  },

  shuffleQueue: () => {
    const { queue, currentIndex, currentSong } = get()
    const otherSongs = queue.filter((_, i) => i !== currentIndex)
    const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
    const newQueue = [currentSong!, ...shuffledOthers]
    set({ queue: newQueue, currentIndex: 0 })
  }
}))