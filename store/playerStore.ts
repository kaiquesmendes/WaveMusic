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
  currentIndex: number
  howl: Howl | null
  
  setCurrentSong: (song: Musica, queue?: Musica[]) => void
  togglePlay: () => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
  seekTo: (position: number) => void
  nextSong: () => void
  previousSong: () => void
  updateTime: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  volume: 70,
  duration: 0,
  currentTime: 0,
  queue: [],
  currentIndex: -1,
  howl: null,

  setCurrentSong: (song, queue = []) => {
    const { howl } = get()
    if (howl) {
      howl.unload()
    }

    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      volume: get().volume / 100,
      onend: () => {
        get().nextSong()
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
      queue: queue.length ? queue : [song],
      currentIndex: 0,
      progress: 0,
      currentTime: 0
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
    const { queue, currentIndex, setCurrentSong } = get()
    if (currentIndex + 1 < queue.length) {
      const nextSong = queue[currentIndex + 1]
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSong, queue)
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