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
  currentIndex: number
  howl: Howl | null
  isShuffle: boolean
  isRepeat: boolean
  
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
  shuffleQueue: () => void
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
  currentIndex: -1,
  howl: null,
  isShuffle: false,
  isRepeat: false,

  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue, currentSong, currentIndex } = get()
    const newShuffleState = !isShuffle
    
    if (newShuffleState) {
      // Ativar shuffle - criar fila embaralhada mantendo a música atual
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
      // Desativar shuffle - restaurar fila original
      set({ 
        isShuffle: false, 
        queue: originalQueue,
        currentIndex: originalQueue.findIndex(s => s.id === currentSong?.id)
      })
    }
  },

  shuffleQueue: () => {
    const { queue, currentIndex, currentSong } = get()
    const otherSongs = queue.filter((_, i) => i !== currentIndex)
    const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
    const newQueue = [currentSong!, ...shuffledOthers]
    set({ queue: newQueue, currentIndex: 0 })
  },

  toggleRepeat: () => {
    set({ isRepeat: !get().isRepeat })
  },

  setCurrentSong: (song, queue = []) => {
    const { howl, isShuffle } = get()
    if (howl) {
      howl.unload()
    }

    const finalQueue = queue.length ? queue : [song]
    
    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      volume: get().volume / 100,
      onend: () => {
        const { isRepeat, currentIndex, queue: currentQueue } = get()
        if (isRepeat) {
          // Repeat mode: tocar a mesma música novamente
          get().seekTo(0)
          get().togglePlay()
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
    const { queue, currentIndex, setCurrentSong, isRepeat } = get()
    if (currentIndex + 1 < queue.length) {
      const nextSong = queue[currentIndex + 1]
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSong, queue)
    } else if (isRepeat) {
      // Se acabou a fila e repeat está ativo, toca a primeira novamente
      const firstSong = queue[0]
      set({ currentIndex: 0 })
      setCurrentSong(firstSong, queue)
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
  }
}))