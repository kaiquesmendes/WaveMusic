// types/index.ts
export interface Usuario {
  id: string
  email: string
  nome: string
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Musica {
  id: string
  titulo: string
  artista: string
  album: string | null
  duracao: number
  url_audio: string
  url_capa: string | null
  genero: string | null
  created_at: string
}

export interface Playlist {
  id: string
  nome: string
  descricao: string | null
  usuario_id: string
  url_capa: string | null
  created_at: string
}

export interface PlaylistMusica {
  id: string
  playlist_id: string
  musica_id: string
  ordem: number
  created_at: string
}

export interface Favorito {
  id: string
  usuario_id: string
  musica_id: string
  created_at: string
}

export interface Historico {
  id: string
  usuario_id: string
  musica_id: string
  played_at: string
}