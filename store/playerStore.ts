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
  isLoading: boolean
  
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
  isLoading: false,

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
      const otherSongs = currentAllSongs.filter((_, i) => i !== randomIndex)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const shuffledQueue = [randomSong, ...shuffledOthers]
      get().setCurrentSong(randomSong, shuffledQueue)
    }
  },

  toggleGlobalShuffle: () => {
    const { isGlobalShuffle } = get()
    set({ isGlobalShuffle: !isGlobalShuffle })
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
    
    // Parar e destruir o Howl atual
    if (howl) {
      howl.stop()
      howl.unload()
    }

    let finalQueue = queue.length ? queue : [song]
    
    // Se o modo aleatório global estiver ativo
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
        console.log('🎵 Música terminou, chamando nextSong...')
        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          get().nextSong()
        }, 50)
      },
      onplay: () => {
        console.log('▶️ Música começou a tocar:', song.titulo)
        set({ isPlaying: true, isLoading: false })
        // Iniciar o loop de atualização de tempo
        const updateLoop = () => {
          if (get().isPlaying && get().howl) {
            const currentTime = get().howl?.seek() as number || 0
            const duration = get().howl?.duration() || 0
            const progress = (currentTime / duration) * 100
            set({ currentTime, progress, duration })
            requestAnimationFrame(updateLoop)
          }
        }
        requestAnimationFrame(updateLoop)
      },
      onpause: () => {
        set({ isPlaying: false })
      },
      onload: () => {
        console.log('✅ Música carregada:', song.titulo)
        set({ duration: newHowl.duration() })
        if (get().isPlaying) {
          newHowl.play()
        }
      },
      onloaderror: (id, error) => {
        console.error('❌ Erro ao carregar música:', error)
        set({ isLoading: false })
        // Tentar próxima música em caso de erro
        setTimeout(() => {
          get().nextSong()
        }, 100)
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
      isLoading: true
    })

    // Iniciar reprodução
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
      set({ progress: (position / duration) * 100, currentTime: position })
    }
  },

  nextSong: () => {
    const { queue, currentIndex, setCurrentSong, isRepeat, isGlobalShuffle, allSongs, currentSong } = get()
    
    console.log('➡️ nextSong chamado, currentIndex:', currentIndex, 'queue length:', queue.length)
    
    // Modo repetir
    if (isRepeat && currentSong) {
      console.log('🔄 Modo repeat: tocando mesma música')
      get().seekTo(0)
      get().togglePlay()
      return
    }
    
    // Próxima música na fila
    if (currentIndex + 1 < queue.length) {
      const nextSong = queue[currentIndex + 1]
      console.log('⏩ Próxima música:', nextSong.titulo)
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSong, queue)
    } 
    // Modo aleatório global: recriar fila
    else if (isGlobalShuffle && allSongs.length > 0) {
      console.log('🌍 Modo global shuffle: recriando fila')
      const remainingSongs = allSongs.filter(s => s.id !== currentSong?.id)
      const shuffledRemaining = [...remainingSongs].sort(() => Math.random() - 0.5)
      const newQueue = [currentSong!, ...shuffledRemaining]
      set({ queue: newQueue, currentIndex: 0 })
      if (newQueue.length > 1) {
        setCurrentSong(newQueue[1], newQueue)
      }
    }
    // Fim da fila
    else {
      console.log('🏁 Fim da fila, parando reprodução')
      set({ isPlaying: false })
    }
  },

  previousSong: () => {
    const { queue, currentIndex, setCurrentSong } = get()
    
    console.log('⬅️ previousSong chamado, currentIndex:', currentIndex)
    
    if (currentIndex - 1 >= 0) {
      const prevSong = queue[currentIndex - 1]
      console.log('⏪ Música anterior:', prevSong.titulo)
      set({ currentIndex: currentIndex - 1 })
      setCurrentSong(prevSong, queue)
    } else {
      console.log('🔁 Primeira música, reiniciando')
      get().seekTo(0)
      if (!get().isPlaying) {
        get().togglePlay()
      }
    }
  },

  updateTime: () => {
    // Esta função é substituída pelo requestAnimationFrame no onplay
  }
}))