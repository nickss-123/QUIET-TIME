'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { toEmail } from '@/lib/username'

function tempPassword() {
  const words = ['grace', 'light', 'anchor', 'harvest', 'river', 'psalm', 'cedar', 'olive']
  const w = words[Math.floor(Math.random() * words.length)]
  return `${w}-${Math.floor(1000 + Math.random() * 9000)}`
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admins only')
  return { supabase, user }
}

export async function createMember(form: FormData) {
  const { supabase, user } = await requireAdmin()

  const username = (form.get('username') as string).trim().toLowerCase()
  const displayName = (form.get('display_name') as string).trim()
  const groupId = (form.get('group_id') as string) || null
  const password = tempPassword()

  if (!username || !displayName) {
    return { ok: false as const, message: 'Username and name are both required.' }
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: toEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName, role: 'member' },
  })
  if (error) return { ok: false as const, message: error.message }

  if (groupId) {
    await supabaseAdmin.from('profiles').update({ group_id: groupId }).eq('id', data.user.id)
  }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.create',
    target_type: 'profile',
    target_id: data.user.id,
    metadata: { username },
  })

  revalidatePath('/admin/users')
  return { ok: true as const, username, password }
}

export async function resetPassword(userId: string) {
  const { supabase, user } = await requireAdmin()
  const password = tempPassword()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
  if (error) return { ok: false as const, message: error.message }

  await supabaseAdmin.from('profiles').update({ must_change_password: true }).eq('id', userId)

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.reset_password',
    target_type: 'profile',
    target_id: userId,
  })

  revalidatePath('/admin/users')
  return { ok: true as const, password }
}

export async function setActive(userId: string, isActive: boolean) {
  const { supabase, user } = await requireAdmin()
  await supabaseAdmin.from('profiles').update({ is_active: isActive }).eq('id', userId)
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: isActive ? 'user.activate' : 'user.deactivate',
    target_type: 'profile',
    target_id: userId,
  })
  revalidatePath('/admin/users')
}

export async function createGroup(form: FormData) {
  const { supabase, user } = await requireAdmin()
  const name = (form.get('name') as string).trim()
  if (!name) return { ok: false as const, message: 'Group name is required.' }

  const { error } = await supabase.from('groups').insert({ name })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath('/admin/users')
  return { ok: true as const }
}
