import { create } from 'zustand'
import { Musica } from '@/types'

export type RepeatMode = 'off' | 'all' | 'one'

interface PlayerState {
  currentSong: Musica | null
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  progress: number
  currentTime: number
  duration: number
  volume: number

  // Contexto de reprodução (como no Spotify):
  //  - originalQueue: a lista de onde a música foi tocada (playlist, álbum, seção da tela...), na ordem original
  //  - queue: a ordem em que as músicas realmente tocam (embaralhada quando o shuffle está ligado)
  originalQueue: Musica[]
  queue: Musica[]
  currentIndex: number
  isShuffle: boolean
  repeatMode: RepeatMode
  // true quando o contexto atual é a biblioteca inteira ("Rádio")
  isGlobalShuffle: boolean

  setCurrentSong: (song: Musica, queue?: Musica[]) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  seekTo: (position: number) => void
  nextSong: () => void
  previousSong: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleGlobalShuffle: () => Promise<void>
  playAllShuffled: (songs?: Musica[]) => Promise<void>
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Fisher–Yates: embaralhamento uniforme (sort(() => Math.random() - 0.5) é enviesado)
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Ordem de reprodução embaralhada. Se `first` for informada, ela vem na frente
// e o restante é embaralhado depois dela; se `avoidFirstId` for informado, a
// primeira faixa nunca será essa (evita repetir a música que acabou de tocar).
function buildShuffledOrder(source: Musica[], first?: Musica | null, avoidFirstId?: string): Musica[] {
  if (first) {
    const rest = shuffleArray(source.filter(s => s.id !== first.id))
    return [first, ...rest]
  }
  const order = shuffleArray(source)
  if (avoidFirstId && order.length > 1 && order[0].id === avoidFirstId) {
    const swapWith = 1 + Math.floor(Math.random() * (order.length - 1))
    ;[order[0], order[swapWith]] = [order[swapWith], order[0]]
  }
  return order
}

/* ------------------------------------------------------------------ */
/* Motor de áudio                                                      */
/* ------------------------------------------------------------------ */
// Um ÚNICO elemento <audio> vive durante toda a sessão e só troca o `src`.
// Criar um player novo a cada faixa faz navegadores móveis (principalmente
// iOS/Safari) bloquearem o autoplay da próxima música, porque o elemento novo
// nunca recebeu um toque do usuário. Reaproveitar o mesmo elemento mantém o
// áudio "destravado" e a fila avança sozinha de forma confiável.

let audioEl: HTMLAudioElement | null = null
let errorStreak = 0
let loadingLibrary = false
// Uma faixa quebrada gera DOIS sinais no navegador (evento "error" e a rejeição
// do play()); este id garante que a mesma falha seja contada uma única vez.
let failedSongId: string | null = null

function isAbortError(err: unknown) {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError'
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  /* ---------- controle do elemento <audio> ---------- */

  function handlePlayError(err: unknown) {
    // Trocar de faixa rapidamente interrompe o play() anterior: é esperado.
    if (isAbortError(err)) return
    // Arquivo inexistente/indisponível: tratado como faixa quebrada (pula para a próxima)
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'NotSupportedError') {
      handleLoadFailure()
      return
    }
    set({
      isPlaying: false,
      isLoading: false,
      error: 'Não foi possível iniciar a reprodução. Toque em play para tentar novamente.'
    })
  }

  // Faixa que não carrega: avisa e pula para a próxima, com limite de falhas seguidas.
  function handleLoadFailure() {
    const failed = get().currentSong
    if (!failed || failedSongId === failed.id) return
    failedSongId = failed.id

    errorStreak += 1
    set({ isLoading: false, isPlaying: false, error: `Não foi possível carregar "${failed.titulo}"` })

    // Limite de falhas seguidas para não entrar em loop infinito quando
    // várias faixas em sequência têm o link quebrado.
    if (errorStreak >= Math.min(get().queue.length, 10)) {
      set({ error: 'Várias músicas falharam ao carregar. Reprodução interrompida.' })
      return
    }
    setTimeout(() => {
      if (get().currentSong?.id === failed.id) advance(true)
    }, 500)
  }

  function getAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null
    if (audioEl) return audioEl

    const a = new Audio()
    a.preload = 'auto'
    a.volume = get().volume / 100
    audioEl = a

    a.addEventListener('loadedmetadata', () => {
      if (isFinite(a.duration)) set({ duration: a.duration })
    })
    a.addEventListener('durationchange', () => {
      if (isFinite(a.duration)) set({ duration: a.duration })
    })
    a.addEventListener('timeupdate', () => {
      const dur = isFinite(a.duration) ? a.duration : 0
      set({
        currentTime: a.currentTime,
        duration: dur || get().duration,
        progress: dur > 0 ? (a.currentTime / dur) * 100 : 0
      })
    })
    a.addEventListener('waiting', () => set({ isLoading: true }))
    a.addEventListener('canplay', () => set({ isLoading: false }))
    a.addEventListener('play', () => set({ isPlaying: true }))
    a.addEventListener('playing', () => {
      errorStreak = 0
      set({ isPlaying: true, isLoading: false, error: null })
    })
    a.addEventListener('pause', () => {
      // Ao chegar no fim o navegador dispara "pause" antes de "ended":
      // não piscar o botão de play entre duas músicas.
      if (a.ended) return
      set({ isPlaying: false })
    })
    a.addEventListener('ended', () => {
      if (get().repeatMode === 'one') {
        a.currentTime = 0
        a.play().catch(handlePlayError)
        return
      }
      advance(true)
    })
    a.addEventListener('error', () => {
      // MEDIA_ERR_ABORTED (1) acontece ao trocar de faixa: não é erro de verdade
      if (!a.error || a.error.code === 1) return
      handleLoadFailure()
    })

    return a
  }

  // Carrega uma faixa no elemento de áudio. `autoplay=false` deixa pausada.
  function loadTrack(song: Musica, autoplay: boolean) {
    const a = getAudio()
    failedSongId = null
    set({
      currentSong: song,
      isLoading: autoplay,
      error: null,
      progress: 0,
      currentTime: 0,
      duration: song.duracao || 0
    })
    if (!a) return

    a.src = song.url_audio
    if (autoplay) {
      a.play().catch(handlePlayError)
    } else {
      set({ isPlaying: false })
    }
  }

  function playIndex(index: number) {
    const { queue } = get()
    const song = queue[index]
    if (!song) return
    set({ currentIndex: index })
    loadTrack(song, true)
  }

  // Avança para a próxima faixa.
  // auto=true  -> a faixa terminou sozinha
  // auto=false -> o usuário clicou em "próxima"
  function advance(auto: boolean) {
    const { queue, originalQueue, currentIndex, repeatMode, isShuffle } = get()
    if (queue.length === 0) return

    const next = currentIndex + 1
    if (next < queue.length) {
      playIndex(next)
      return
    }

    // Chegou ao fim da fila
    if (repeatMode === 'all' || !auto) {
      if (isShuffle && queue.length > 1) {
        // Novo ciclo: reembaralha, sem começar pela música que acabou de tocar
        const order = buildShuffledOrder(originalQueue.length ? originalQueue : queue, null, queue[currentIndex]?.id)
        set({ queue: order })
      }
      playIndex(0)
      return
    }

    // repeat desligado e a fila acabou sozinha: para e deixa a 1ª faixa pronta (como o Spotify)
    set({ currentIndex: 0 })
    loadTrack(queue[0], false)
  }

  /* ---------- estado e ações públicas ---------- */

  return {
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    error: null,
    progress: 0,
    currentTime: 0,
    duration: 0,
    volume: 70,

    originalQueue: [],
    queue: [],
    currentIndex: -1,
    isShuffle: false,
    repeatMode: 'off',
    isGlobalShuffle: false,

    setCurrentSong: (song, queue) => {
      errorStreak = 0

      // Sem lista informada: se a música já está na fila atual, mantém o contexto
      // e a ordem; caso contrário toca só ela.
      if (!queue || queue.length === 0) {
        const idx = get().queue.findIndex(s => s.id === song.id)
        if (idx >= 0) {
          set({ currentIndex: idx })
          loadTrack(song, true)
          return
        }
        queue = [song]
      }

      const { isShuffle } = get()
      const source = [...queue]
      if (isShuffle && source.length > 1) {
        set({ originalQueue: source, queue: buildShuffledOrder(source, song), currentIndex: 0, isGlobalShuffle: false })
      } else {
        set({ originalQueue: source, queue: source, currentIndex: Math.max(0, source.findIndex(s => s.id === song.id)), isGlobalShuffle: false })
      }
      loadTrack(song, true)
    },

    togglePlay: () => {
      const a = getAudio()
      if (!a || !get().currentSong) return
      if (a.paused) {
        a.play().catch(handlePlayError)
      } else {
        a.pause()
      }
    },

    setVolume: (volume) => {
      const a = getAudio()
      if (a) a.volume = Math.min(1, Math.max(0, volume / 100))
      set({ volume })
    },

    seekTo: (position) => {
      const a = getAudio()
      if (!a || !isFinite(position)) return
      a.currentTime = position
      const dur = get().duration
      set({ currentTime: position, progress: dur > 0 ? (position / dur) * 100 : 0 })
    },

    nextSong: () => advance(false),

    previousSong: () => {
      const { queue, currentIndex, currentTime, repeatMode } = get()
      if (queue.length === 0) return

      // Passou de 3s: volta para o início da música atual (como o Spotify)
      if (currentTime > 3) {
        get().seekTo(0)
        return
      }

      if (currentIndex > 0) {
        playIndex(currentIndex - 1)
      } else if (repeatMode === 'all' && queue.length > 1) {
        playIndex(queue.length - 1)
      } else {
        get().seekTo(0)
      }
    },

    toggleShuffle: () => {
      const { isShuffle, originalQueue, queue, currentSong } = get()
      const source = originalQueue.length ? originalQueue : queue

      if (!isShuffle) {
        // Liga: música atual vai para a frente e o resto é embaralhado
        set({
          isShuffle: true,
          queue: buildShuffledOrder(source, currentSong),
          currentIndex: 0
        })
      } else {
        // Desliga: volta para a ordem original, continuando da música atual
        const idx = source.findIndex(s => s.id === currentSong?.id)
        set({
          isShuffle: false,
          isGlobalShuffle: false,
          queue: [...source],
          currentIndex: idx >= 0 ? idx : 0
        })
      }
    },

    // off -> all (repete a fila) -> one (repete a faixa) -> off
    toggleRepeat: () => {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const next = order[(order.indexOf(get().repeatMode) + 1) % order.length]
      set({ repeatMode: next })
    },

    // "Rádio": toca a biblioteca inteira no aleatório (ou desliga o aleatório)
    toggleGlobalShuffle: async () => {
      if (get().isGlobalShuffle) {
        get().toggleShuffle() // desliga o shuffle e restaura a ordem original
        set({ isGlobalShuffle: false })
        return
      }
      await get().playAllShuffled()
    },

    playAllShuffled: async (songs) => {
      if (loadingLibrary) return
      let library = songs

      if (!library || library.length === 0) {
        loadingLibrary = true
        set({ isLoading: true, error: null })
        try {
          const { musicService } = await import('@/services/musicService')
          library = await musicService.getAll()
        } catch (e) {
          console.error('Erro ao carregar músicas:', e)
          set({ isLoading: false, error: 'Não foi possível carregar a biblioteca de músicas.' })
          return
        } finally {
          loadingLibrary = false
        }
      }

      if (!library || library.length === 0) {
        set({ isLoading: false, error: 'Nenhuma música encontrada.' })
        return
      }

      errorStreak = 0
      const first = library[Math.floor(Math.random() * library.length)]
      set({
        originalQueue: [...library],
        queue: buildShuffledOrder(library, first),
        currentIndex: 0,
        isShuffle: true,
        repeatMode: 'all', // a rádio nunca deve acabar
        isGlobalShuffle: true
      })
      loadTrack(first, true)
    }
  }
})
