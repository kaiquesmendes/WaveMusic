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
  isShuffle: boolean
  isRepeat: boolean
  isGlobalShuffle: boolean
  isLoading: boolean
  
  setCurrentSong: (song: Musica, queue?: Musica[]) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  seekTo: (position: number) => void
  nextSong: () => void
  previousSong: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleGlobalShuffle: () => void
  loadAllSongs: () => Promise<void>
  playRandomSong: () => Promise<void>
  destroyHowl: () => void
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
  isShuffle: false,
  isRepeat: false,
  isGlobalShuffle: false,
  isLoading: false,

  destroyHowl: () => {
    const { howl } = get()
    if (howl) {
      try {
        howl.stop()
        howl.unload()
      } catch (e) {
        console.error('Erro ao destruir Howl:', e)
      }
      set({ howl: null })
    }
  },

  loadAllSongs: async () => {
    const supabaseAny = (await import('@/lib/supabase/client')).supabase as any
    const { data } = await supabaseAny
      .from('musicas')
      .select('*')
    
    if (data && data.length > 0) {
      set({ queue: data, currentIndex: 0 })
    }
  },

  playRandomSong: async () => {
    const { queue, loadAllSongs, destroyHowl, setCurrentSong } = get()
    
    let currentQueue = queue
    if (currentQueue.length === 0) {
      await loadAllSongs()
      currentQueue = get().queue
    }
    
    if (currentQueue.length > 0) {
      destroyHowl()
      const randomIndex = Math.floor(Math.random() * currentQueue.length)
      const randomSong = currentQueue[randomIndex]
      setCurrentSong(randomSong, currentQueue)
    }
  },

  toggleGlobalShuffle: () => {
    const { isGlobalShuffle, queue, loadAllSongs } = get()
    const newState = !isGlobalShuffle
    
    if (newState && queue.length === 0) {
      loadAllSongs()
    }
    
    set({ isGlobalShuffle: newState })
  },

  toggleShuffle: () => {
    const { isShuffle, queue, currentSong } = get()
    const newShuffleState = !isShuffle
    
    if (newShuffleState && queue.length > 1 && currentSong) {
      const otherSongs = queue.filter(s => s.id !== currentSong.id)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const newQueue = [currentSong, ...shuffledOthers]
      set({ 
        isShuffle: true, 
        queue: newQueue,
        currentIndex: 0
      })
    } else {
      set({ isShuffle: false })
    }
  },

  toggleRepeat: () => {
    set({ isRepeat: !get().isRepeat })
  },

  setCurrentSong: (song, queue = []) => {
    // Destruir Howl anterior primeiro
    get().destroyHowl()

    const finalQueue = queue.length ? queue : [song]
    const currentIndex = finalQueue.findIndex(s => s.id === song.id)
    
    let updateProgressFrame: number | null = null
    let isFirstPlay = true
    
    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      volume: get().volume / 100,
      onend: () => {
        console.log('🎵 Música terminou:', song.titulo)
        // Chamar nextSong diretamente, sem setTimeout
        get().nextSong()
      },
      onplay: () => {
        console.log('▶️ Reproduzindo:', song.titulo)
        set({ isPlaying: true, isLoading: false })
        
        // Cancelar frame anterior se existir
        if (updateProgressFrame) {
          cancelAnimationFrame(updateProgressFrame)
        }
        
        // Atualizar progresso
        const updateProgress = () => {
          const { howl: currentHowl, isPlaying: stillPlaying } = get()
          if (currentHowl && stillPlaying) {
            const seek = currentHowl.seek() as number
            const dur = currentHowl.duration() || 0
            set({ 
              currentTime: seek, 
              duration: dur,
              progress: dur > 0 ? (seek / dur) * 100 : 0 
            })
            updateProgressFrame = requestAnimationFrame(updateProgress)
          }
        }
        updateProgressFrame = requestAnimationFrame(updateProgress)
      },
      onpause: () => {
        set({ isPlaying: false })
      },
      onload: () => {
        console.log('✅ Música carregada:', song.titulo)
        set({ duration: newHowl.duration() })
        if (isFirstPlay) {
          isFirstPlay = false
          newHowl.play()
        }
      },
      onloaderror: (id, error) => {
        console.error('❌ Erro ao carregar:', song.titulo, error)
        set({ isLoading: false })
        // Tentar próxima música após erro
        setTimeout(() => get().nextSong(), 500)
      }
    })

    set({
      currentSong: song,
      howl: newHowl,
      queue: finalQueue,
      currentIndex,
      progress: 0,
      currentTime: 0,
      isLoading: true
    })
  },

  togglePlay: () => {
    const { howl, isPlaying, isLoading } = get()
    if (!howl || isLoading) return

    if (isPlaying) {
      howl.pause()
    } else {
      howl.play()
    }
    set({ isPlaying: !isPlaying })
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
    if (howl && duration > 0) {
      howl.seek(position)
      set({ 
        currentTime: position, 
        progress: duration > 0 ? (position / duration) * 100 : 0 
      })
    }
  },

  nextSong: () => {
    const { queue, currentIndex, setCurrentSong, isRepeat, currentSong, isGlobalShuffle, destroyHowl } = get()
    
    console.log('➡️ nextSong - Index:', currentIndex, 'Queue:', queue.length)
    
    // Modo repetir
    if (isRepeat && currentSong) {
      console.log('🔄 Modo repeat:', currentSong.titulo)
      destroyHowl()
      setCurrentSong(currentSong, queue)
      return
    }
    
    // Modo aleatório global
    if (isGlobalShuffle && queue.length === 0) {
      get().loadAllSongs()
      setTimeout(() => {
        const newQueue = get().queue
        if (newQueue.length > 0) {
          const randomIndex = Math.floor(Math.random() * newQueue.length)
          destroyHowl()
          setCurrentSong(newQueue[randomIndex], newQueue)
        }
      }, 100)
      return
    }
    
    // Próxima música na fila
    if (currentIndex + 1 < queue.length) {
      const nextSongItem = queue[currentIndex + 1]
      console.log('⏩ Próxima música:', nextSongItem.titulo)
      destroyHowl()
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSongItem, queue)
    } 
    // Reiniciar fila
    else if (queue.length > 0) {
      console.log('🔄 Reiniciando fila do início')
      destroyHowl()
      set({ currentIndex: 0 })
      setCurrentSong(queue[0], queue)
    }
    else {
      console.log('🏁 Fim da fila, sem músicas')
      set({ isPlaying: false })
    }
  },

  previousSong: () => {
    const { queue, currentIndex, setCurrentSong, currentTime, destroyHowl } = get()
    
    // Se passou mais de 3 segundos, reinicia a música atual
    if (currentTime > 3) {
      console.log('🔁 Reiniciando música atual')
      get().seekTo(0)
      return
    }
    
    // Voltar para música anterior
    if (currentIndex - 1 >= 0) {
      const prevSong = queue[currentIndex - 1]
      console.log('⏪ Música anterior:', prevSong.titulo)
      destroyHowl()
      set({ currentIndex: currentIndex - 1 })
      setCurrentSong(prevSong, queue)
    } else {
      console.log('🔁 Primeira música, reiniciando')
      get().seekTo(0)
      if (!get().isPlaying) {
        get().togglePlay()
      }
    }
  }
}))