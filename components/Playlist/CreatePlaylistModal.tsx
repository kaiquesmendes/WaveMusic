'use client'

import { useState } from 'react'
import { Modal } from '@/components/UI/Modal'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Music, Loader2 } from 'lucide-react'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!nome.trim()) {
      setError('Digite um nome para a playlist')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        usuario_id: user.id,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      router.push(`/playlist/${data.id}`)
      onClose()
      setNome('')
      setDescricao('')
    }
    setLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Playlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Music size={32} className="text-white" />
          </div>
        </div>

        <Input
          label="Nome da playlist"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Minhas Favoritas"
          required
          autoFocus
        />
        <Input
          label="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva sua playlist..."
        />

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}