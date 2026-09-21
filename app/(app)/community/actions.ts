'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CommentState = { ok: false; message: string } | { ok: true }

// ---- Questions (threaded, uses the existing public.comments table) -----

export async function addComment(
  _prevState: CommentState,
  form: FormData
): Promise<CommentState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const body = ((form.get('body') as string) || '').trim()
  if (!body) return { ok: false, message: 'Write something before posting.' }
  if (body.length > 2000) return { ok: false, message: 'That\u2019s too long \u2014 keep it under 2000 characters.' }

  const parentIdRaw = form.get('parent_id') as string | null
  const parentId = parentIdRaw && parentIdRaw.trim() !== '' ? parentIdRaw : null

  const { error } = await supabase.from('comments').insert({
    user_id: user.id,
    body,
    parent_id: parentId,
  })

  if (error) return { ok: false, message: error.message }

  revalidatePath('/community')
  return { ok: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/community')
  return { ok: true }
}

// ---- Group chat + General chat (public.chat_messages) -------------------

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function sendChat(
  _prevState: CommentState,
  form: FormData
): Promise<CommentState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const channel = form.get('channel') === 'group' ? 'group' : 'general'
  const body = ((form.get('body') as string) || '').trim()
  const image = form.get('image')
  const file = image instanceof File && image.size > 0 ? image : null
  // Anonymous posting is only allowed in the general chat.
  const isAnonymous = channel === 'general' && form.get('anonymous') === 'on'

  if (!body && !file) return { ok: false, message: 'Write a message or attach a photo.' }
  if (body.length > 2000) return { ok: false, message: 'Keep messages under 2000 characters.' }

  let groupId: string | null = null
  if (channel === 'group') {
    const { data: me } = await supabase.from('profiles').select('group_id, role').eq('id', user.id).single()
    const requested = (form.get('group_id') as string) || null
    groupId = me?.role === 'admin' && requested ? requested : (me?.group_id ?? null)
    if (!groupId) return { ok: false, message: 'You are not in a group yet. Ask the admin to add you to one.' }
  }

  let imagePath: string | null = null
  if (file) {
    if (!file.type.startsWith('image/')) return { ok: false, message: 'Only images can be attached.' }
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: 'Images must be under 5 MB.' }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('chat-images')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) return { ok: false, message: `Photo upload failed: ${upErr.message}` }
    imagePath = path
  }

  const { error } = await supabase.from('chat_messages').insert({
    channel,
    group_id: groupId,
    user_id: user.id,
    body: body || null,
    image_path: imagePath,
    is_anonymous: isAnonymous,
  })
  if (error) return { ok: false, message: error.message }

  revalidatePath('/community')
  return { ok: true }
}

export async function deleteChat(messageId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/community')
  return { ok: true }
}
