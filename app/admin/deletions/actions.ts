'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; message: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admins only')
  return { supabase, user }
}

// Approving runs the SQL function that deletes both entries for that day
// and stamps the request — one transaction, so it can't half-succeed.
export async function approveDeletion(requestId: string): Promise<Result> {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase.rpc('approve_deletion', { p_request: requestId })
  if (error) return { ok: false, message: error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'entry.delete_approved',
    target_type: 'deletion_request',
    target_id: requestId,
  })

  revalidatePath('/admin/deletions')
  revalidatePath('/admin')
  revalidatePath('/logs')
  return { ok: true }
}

export async function rejectDeletion(requestId: string): Promise<Result> {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from('deletion_requests')
    .update({ status: 'rejected', decided_by: user.id, decided_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending')
  if (error) return { ok: false, message: error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'entry.delete_rejected',
    target_type: 'deletion_request',
    target_id: requestId,
  })

  revalidatePath('/admin/deletions')
  revalidatePath('/admin')
  revalidatePath('/logs')
  return { ok: true }
}
