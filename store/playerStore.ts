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
  error: string | null

  // controle interno (não usar fora da store)
  _playToken: number
  _progressInterval: ReturnType<typeof setInterval> | null
  _shuffleHistory: string[]
  _errorStreak: number

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

// Escolhe a próxima música aleatória evitando repetir até esgotar a lista
function pickRandomSong(queue: Musica[], history: string[], excludeId?: string): { song: Musica; newHistory: string[] } {
  const candidates = queue.filter(s => s.id !== excludeId)
  let pool = candidates.filter(s => !history.includes(s.id))

  // Já tocou todas as outras músicas -> reinicia o histórico
  if (pool.length === 0) {
    pool = candidates.length > 0 ? candidates : queue
    history = []
  }

  const song = pool[Math.floor(Math.random() * pool.length)]
  return { song, newHistory: [...history, song.id] }
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
  error: null,

  _playToken: 0,
  _progressInterval: null,
  _shuffleHistory: [],
  _errorStreak: 0,

  destroyHowl: () => {
    const { howl, _progressInterval } = get()

    // Invalida qualquer callback "zumbi" de uma instância antiga do Howl
    set({ _playToken: get()._playToken + 1 })

    if (_progressInterval) {
      clearInterval(_progressInterval)
    }

    if (howl) {
      try {
        howl.off() // remove todos os listeners antes de descarregar
        howl.stop()
        howl.unload()
      } catch (e) {
        console.error('Erro ao destruir Howl:', e)
      }
    }

    set({ howl: null, _progressInterval: null })
  },

  loadAllSongs: async () => {
    const supabaseAny = (await import('@/lib/supabase/client')).supabase as any
    const { data, error } = await supabaseAny
      .from('musicas')
      .select('*')

    if (error) {
      console.error('Erro ao carregar músicas:', error)
      return
    }

    if (data && data.length > 0) {
      set({ queue: data, currentIndex: 0 })
    }
  },

  playRandomSong: async () => {
    const { queue, loadAllSongs, setCurrentSong, _shuffleHistory } = get()

    let currentQueue = queue
    if (currentQueue.length === 0) {
      await loadAllSongs()
      currentQueue = get().queue
    }

    if (currentQueue.length > 0) {
      const { song, newHistory } = pickRandomSong(currentQueue, _shuffleHistory)
      set({ _shuffleHistory: newHistory })
      setCurrentSong(song, currentQueue)
    }
  },

  toggleGlobalShuffle: () => {
    const { isGlobalShuffle, queue, loadAllSongs } = get()
    const newState = !isGlobalShuffle

    if (newState && queue.length === 0) {
      loadAllSongs()
    }

    set({ isGlobalShuffle: newState, isShuffle: false, _shuffleHistory: [] })
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
        isGlobalShuffle: false,
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
    // Destrói o Howl anterior e invalida callbacks pendentes dele
    get().destroyHowl()

    const finalQueue = queue.length ? queue : [song]
    const currentIndex = finalQueue.findIndex(s => s.id === song.id)

    // Token desta instância: qualquer callback do Howl só age se o token
    // ainda for o atual, evitando que uma instância antiga (já destruída)
    // dispare nextSong() duas vezes e "coma" músicas da fila.
    const myToken = get()._playToken

    const newHowl = new Howl({
      src: [song.url_audio],
      html5: true,
      preload: true,
      volume: get().volume / 100,
      onend: () => {
        if (get()._playToken !== myToken) return
        get()._errorStreak = 0
        get().nextSong()
      },
      onplay: () => {
        if (get()._playToken !== myToken) return
        set({ isPlaying: true, isLoading: false, error: null })
        get()._errorStreak = 0

        const existing = get()._progressInterval
        if (existing) clearInterval(existing)

        // setInterval continua rodando (ainda que mais devagar) com a aba
        // em segundo plano, ao contrário de requestAnimationFrame, que
        // congela completamente quando a aba não está visível.
        const interval = setInterval(() => {
          if (get()._playToken !== myToken) {
            clearInterval(interval)
            return
          }
          const seek = newHowl.seek()
          const dur = newHowl.duration() || 0
          if (typeof seek === 'number') {
            set({
              currentTime: seek,
              duration: dur,
              progress: dur > 0 ? (seek / dur) * 100 : 0
            })
          }
        }, 500)

        set({ _progressInterval: interval })
      },
      onpause: () => {
        if (get()._playToken !== myToken) return
        set({ isPlaying: false })
      },
      onload: () => {
        if (get()._playToken !== myToken) return
        set({ duration: newHowl.duration() })
        newHowl.play()
      },
      onplayerror: () => {
        if (get()._playToken !== myToken) return
        // Navegadores podem bloquear autoplay sem gesto do usuário.
        // Tenta destravar o áudio assim que o usuário interagir com a página.
        newHowl.once('unlock', () => {
          if (get()._playToken === myToken) newHowl.play()
        })
      },
      onloaderror: (id, error) => {
        if (get()._playToken !== myToken) return
        console.error('❌ Erro ao carregar:', song.titulo, error)

        const streak = get()._errorStreak + 1
        set({ isLoading: false, error: `Não foi possível carregar "${song.titulo}"`, _errorStreak: streak })

        // Limite de tentativas em sequência para não entrar em loop infinito
        // caso várias faixas seguidas tenham um link quebrado.
        if (streak >= Math.min(finalQueue.length, 10)) {
          set({ isPlaying: false, error: 'Várias músicas falharam ao carregar. Reprodução interrompida.' })
          return
        }
        setTimeout(() => {
          if (get()._playToken === myToken) get().nextSong()
        }, 500)
      }
    })

    set({
      currentSong: song,
      howl: newHowl,
      queue: finalQueue,
      currentIndex,
      progress: 0,
      currentTime: 0,
      isLoading: true,
      error: null
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
    const { queue, currentIndex, setCurrentSong, isRepeat, currentSong, isGlobalShuffle, _shuffleHistory } = get()

    // Modo repetir
    if (isRepeat && currentSong) {
      setCurrentSong(currentSong, queue)
      return
    }

    // Modo aleatório global: sempre sorteia a próxima, mesmo com fila carregada
    if (isGlobalShuffle) {
      const playNextRandom = (sourceQueue: Musica[]) => {
        if (sourceQueue.length === 0) {
          set({ isPlaying: false })
          return
        }
        const { song, newHistory } = pickRandomSong(sourceQueue, _shuffleHistory, currentSong?.id)
        set({ _shuffleHistory: newHistory })
        setCurrentSong(song, sourceQueue)
      }

      if (queue.length === 0) {
        get().loadAllSongs().then(() => playNextRandom(get().queue))
      } else {
        playNextRandom(queue)
      }
      return
    }

    // Próxima música na fila
    if (currentIndex + 1 < queue.length) {
      const nextSongItem = queue[currentIndex + 1]
      setCurrentSong(nextSongItem, queue)
    }
    // Reiniciar fila
    else if (queue.length > 0) {
      setCurrentSong(queue[0], queue)
    }
    else {
      set({ isPlaying: false })
    }
  },

  previousSong: () => {
    const { queue, currentIndex, setCurrentSong, currentTime, isGlobalShuffle } = get()

    // Se passou mais de 3 segundos, reinicia a música atual
    if (currentTime > 3) {
      get().seekTo(0)
      return
    }

    if (isGlobalShuffle) {
      // No modo aleatório global não há "anterior" determinístico: reinicia a atual
      get().seekTo(0)
      return
    }

    // Voltar para música anterior
    if (currentIndex - 1 >= 0) {
      const prevSong = queue[currentIndex - 1]
      setCurrentSong(prevSong, queue)
    } else {
      get().seekTo(0)
      if (!get().isPlaying) {
        get().togglePlay()
      }
    }
  }
}))
