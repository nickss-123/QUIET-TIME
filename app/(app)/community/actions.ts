'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CommentState = { ok: false; message: string } | { ok: true }

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

  const { error } = await supabase.from('comments').insert({
    user_id: user.id,
    body,
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
