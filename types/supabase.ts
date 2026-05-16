export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      musicas: {
        Row: {
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
        Insert: {
          id?: string
          titulo: string
          artista: string
          album?: string | null
          duracao: number
          url_audio: string
          url_capa?: string | null
          genero?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          artista?: string
          album?: string | null
          duracao?: number
          url_audio?: string
          url_capa?: string | null
          genero?: string | null
          created_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          usuario_id: string
          url_capa: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          usuario_id: string
          url_capa?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          usuario_id?: string
          url_capa?: string | null
          created_at?: string
        }
      }
      playlist_musicas: {
        Row: {
          id: string
          playlist_id: string
          musica_id: string
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          musica_id: string
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          musica_id?: string
          ordem?: number
          created_at?: string
        }
      }
      favoritos: {
        Row: {
          id: string
          usuario_id: string
          musica_id: string
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          musica_id: string
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          musica_id?: string
          created_at?: string
        }
      }
      historico: {
        Row: {
          id: string
          usuario_id: string
          musica_id: string
          played_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          musica_id: string
          played_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          musica_id?: string
          played_at?: string
        }
      }
    }
  }
}