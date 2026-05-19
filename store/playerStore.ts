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
  isTransitioning: boolean
  
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
  cleanup: () => void
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
  isTransitioning: false,

  cleanup: () => {
    const { howl } = get()
    if (howl) {
      howl.stop()
      howl.unload()
    }
    set({ howl: null, isTransitioning: false })
  },

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
    const { allSongs, loadAllSongs, cleanup, setCurrentSong } = get()
    
    if (allSongs.length === 0) {
      await loadAllSongs()
    }
    
    const currentAllSongs = get().allSongs
    if (currentAllSongs.length > 0) {
      cleanup()
      const randomIndex = Math.floor(Math.random() * currentAllSongs.length)
      const randomSong = currentAllSongs[randomIndex]
      const otherSongs = currentAllSongs.filter((_, i) => i !== randomIndex)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const shuffledQueue = [randomSong, ...shuffledOthers]
      setCurrentSong(randomSong, shuffledQueue)
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
    const { howl, isGlobalShuffle, allSongs, cleanup, isTransitioning } = get()
    
    // Evitar transições duplicadas
    if (isTransitioning) {
      console.log('⏳ Transição em andamento, ignorando...')
      return
    }
    
    set({ isTransitioning: true, isLoading: true })
    
    // Limpar o Howl anterior
    if (howl) {
      howl.stop()
      howl.unload()
    }

    let finalQueue = queue.length ? queue : [song]
    
    // Modo aleatório global
    if (isGlobalShuffle && finalQueue.length === 1 && allSongs.length > 0) {
      const otherSongs = allSongs.filter(s => s.id !== song.id)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      finalQueue = [song, ...shuffledOthers]
    }
    
    let isFirstPlay = true
    
    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      volume: get().volume / 100,
      onend: () => {
        console.log('🎵 Música terminou:', song.titulo)
        // Pequeno delay para evitar conflitos
        setTimeout(() => {
          const { nextSong } = get()
          nextSong()
        }, 100)
      },
      onplay: () => {
        console.log('▶️ Reproduzindo:', song.titulo)
        set({ isPlaying: true, isLoading: false, isTransitioning: false })
        
        // Loop de atualização de progresso
        const updateProgress = () => {
          const { howl: currentHowl, isPlaying: stillPlaying } = get()
          if (currentHowl && stillPlaying) {
            const currentTime = currentHowl.seek() as number
            const duration = currentHowl.duration() || 0
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0
            set({ currentTime, progress, duration })
            requestAnimationFrame(updateProgress)
          }
        }
        requestAnimationFrame(updateProgress)
      },
      onpause: () => {
        set({ isPlaying: false })
      },
      onload: () => {
        console.log('✅ Música carregada:', song.titulo, 'Duração:', newHowl.duration())
        set({ duration: newHowl.duration() })
        if (isFirstPlay) {
          isFirstPlay = false
          newHowl.play()
        }
      },
      onloaderror: (id, error) => {
        console.error('❌ Erro ao carregar:', song.titulo, error)
        set({ isLoading: false, isTransitioning: false })
        // Tentar próxima música
        setTimeout(() => {
          const { nextSong } = get()
          nextSong()
        }, 500)
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
      duration: 0,
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
      set({ currentTime: position, progress: (position / duration) * 100 })
    }
  },

  nextSong: () => {
    const { queue, currentIndex, setCurrentSong, isRepeat, isGlobalShuffle, allSongs, currentSong, isTransitioning, cleanup } = get()
    
    // Evitar chamadas durante transição
    if (isTransitioning) {
      console.log('⏳ Aguardando transição...')
      return
    }
    
    console.log('➡️ nextSong - Index:', currentIndex, 'Queue length:', queue.length)
    
    // Modo repetir
    if (isRepeat && currentSong) {
      console.log('🔄 Modo repeat:', currentSong.titulo)
      cleanup()
      setCurrentSong(currentSong, queue)
      return
    }
    
    // Próxima música na fila
    if (currentIndex + 1 < queue.length) {
      const nextSongItem = queue[currentIndex + 1]
      console.log('⏩ Próxima música:', nextSongItem.titulo)
      cleanup()
      set({ currentIndex: currentIndex + 1 })
      setCurrentSong(nextSongItem, queue)
    } 
    // Modo aleatório global
    else if (isGlobalShuffle && allSongs.length > 0) {
      console.log('🌍 Global shuffle - recriando fila')
      cleanup()
      const otherSongs = allSongs.filter(s => s.id !== currentSong?.id)
      const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5)
      const newQueue = [currentSong!, ...shuffledOthers]
      set({ queue: newQueue, currentIndex: 0 })
      if (newQueue.length > 1) {
        setCurrentSong(newQueue[1], newQueue)
      } else {
        set({ isPlaying: false, isTransitioning: false })
      }
    }
    // Fim da fila
    else {
      console.log('🏁 Fim da fila')
      set({ isPlaying: false, isTransitioning: false })
    }
  },

  previousSong: () => {
    const { queue, currentIndex, setCurrentSong, currentTime, cleanup, isTransitioning } = get()
    
    if (isTransitioning) return
    
    console.log('⬅️ previousSong - Index:', currentIndex, 'CurrentTime:', currentTime)
    
    // Se passou mais de 3 segundos, reinicia a música atual
    if (currentTime > 3) {
      console.log('🔁 Reiniciando música atual')
      cleanup()
      const { currentSong } = get()
      if (currentSong) {
        setCurrentSong(currentSong, queue)
      }
      return
    }
    
    // Voltar para música anterior
    if (currentIndex - 1 >= 0) {
      const prevSong = queue[currentIndex - 1]
      console.log('⏪ Música anterior:', prevSong.titulo)
      cleanup()
      set({ currentIndex: currentIndex - 1 })
      setCurrentSong(prevSong, queue)
    } else {
      console.log('🔁 Primeira música, reiniciando')
      cleanup()
      const { currentSong } = get()
      if (currentSong) {
        setCurrentSong(currentSong, queue)
      }
    }
  }
}))