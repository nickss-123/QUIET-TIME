'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; message: string }

// A member can't delete a day's QT themselves. They ask, the admin is
// notified in the admin panel, and only an approved request removes it.
export async function requestDeletion(entryDate: string, reason: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Not signed in' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return { ok: false, message: 'Invalid date.' }

  const { error } = await supabase.from('deletion_requests').insert({
    user_id: user.id,
    entry_date: entryDate,
    reason: reason.trim().slice(0, 500) || null,
  })
  if (error) {
    if (error.code === '23505') return { ok: false, message: 'You already asked to delete this day. Waiting for the admin.' }
    return { ok: false, message: error.message }
  }

  revalidatePath(`/logs/${entryDate}`)
  revalidatePath('/logs')
  revalidatePath('/admin/deletions')
  return { ok: true }
}

export async function cancelDeletionRequest(requestId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Not signed in' }

  const { error } = await supabase
    .from('deletion_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
  if (error) return { ok: false, message: error.message }

  revalidatePath('/logs')
  revalidatePath('/admin/deletions')
  return { ok: true }
}
