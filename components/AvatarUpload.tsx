'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX_EDGE = 512

async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const edge = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.min(edge, MAX_EDGE)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    bitmap,
    (bitmap.width - edge) / 2,
    (bitmap.height - edge) / 2,
    edge,
    edge,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not process that image'))),
      'image/webp',
      0.85
    )
  )
}

export default function AvatarUpload({
  userId,
  currentPath,
}: {
  userId: string
  currentPath: string | null
}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const [preview, setPreview] = useState<string | null>(
    currentPath ? `${base}/storage/v1/object/public/avatars/${currentPath}` : null
  )
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()

  async function handle(file: File) {
    if (!file.type.startsWith('image/')) return setStatus('Choose an image file.')
    setStatus('Uploading\u2026')
    const supabase = createClient()

    try {
      const blob = await toSquareWebp(file)
      const path = `${userId}/${Date.now()}.webp`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/webp' })
      if (upErr) throw upErr

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_path')
        .eq('id', userId)
        .single()

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_path: path })
        .eq('id', userId)
      if (dbErr) throw dbErr

      if (profile?.avatar_path) {
        await supabase.storage.from('avatars').remove([profile.avatar_path])
      }

      setPreview(`${base}/storage/v1/object/public/avatars/${path}`)
      setStatus(null)
      router.refresh()
    } catch (e: any) {
      setStatus(e.message ?? 'Upload failed. Try a different image.')
    }
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="size-20 rounded-full object-cover" />
      ) : (
        <div className="size-20 rounded-full border border-line bg-surface" />
      )}
      <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink">
        Choose photo
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
        />
      </label>
      {status && <p className="text-sm text-muted">{status}</p>}
    </div>
  )
}
