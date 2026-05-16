'use client'

import { useEffect, useState } from 'react'
import { PlaylistCard } from '@/components/Playlist/PlaylistCard'
import { MusicList } from '@/components/Music/MusicList'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Playlist, Musica } from '@/types'
import { Library, ListMusic, Heart } from 'lucide-react'
import Link from 'next/link'
import { CreatePlaylistModal } from '@/components/Playlist/CreatePlaylistModal'

export default function LibraryPage() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [favorites, setFavorites] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchUserData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Fetch playlists
    const { data: playlistsData } = await supabase
      .from('playlists')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (playlistsData) setPlaylists(playlistsData)

    // Fetch favorites usando o mesmo método do favorites
    const { data: favoritosData } = await supabase
      .from('favoritos')
      .select(`
        musica_id,
        musicas:musica_id (*)
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (favoritosData && favoritosData.length > 0) {
      const musicasList = favoritosData
        .map(item => (item as any).musicas)
        .filter((m): m is Musica => m !== null)
      setFavorites(musicasList)
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <Library size={32} className="text-purple-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Sua Biblioteca</h1>
          <p className="text-gray-400 text-sm mt-1">Suas playlists e músicas curtidas</p>
        </div>
      </div>

      {/* Favorites Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Músicas Curtidas</h2>
          </div>
          <Link href="/favorites" className="text-sm text-purple-400 hover:text-purple-300">
            Ver todas →
          </Link>
        </div>
        {favorites.length > 0 ? (
          <MusicList musicas={favorites} />
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">Você ainda não curtiu nenhuma música</p>
            <Link href="/explore" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
              Explorar músicas →
            </Link>
          </div>
        )}
      </section>

      {/* Playlists Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListMusic size={20} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Suas Playlists</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            + Criar playlist
          </button>
        </div>
        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400">Você ainda não tem playlists</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
            >
              Criar primeira playlist →
            </button>
          </div>
        )}
      </section>

      <CreatePlaylistModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        fetchUserData()
      }} />
    </div>
  )
}