'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseJs } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { toEmail } from '@/lib/username'

type Result = { ok: true; message: string } | { ok: false; message: string }

const USERNAME_RE = /^[a-z0-9._-]{3,24}$/

// Checks the current password by signing in with a throwaway client (no
// cookies, no persisted session), so a stolen open session alone can't be
// used to change credentials.
async function verifyCurrentPassword(username: string, password: string) {
  const probe = createSupabaseJs(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )
  const { error } = await probe.auth.signInWithPassword({ email: toEmail(username), password })
  return !error
}

export async function changeUsername(_prev: Result | null, form: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Not signed in' }

  const next = ((form.get('username') as string) || '').trim().toLowerCase()
  const password = (form.get('current_password') as string) || ''

  if (!USERNAME_RE.test(next)) {
    return { ok: false, message: 'Usernames are 3–24 characters: letters, numbers, dots, dashes or underscores.' }
  }

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  if (!profile) return { ok: false, message: 'Profile not found.' }
  if (profile.username === next) return { ok: false, message: 'That is already your username.' }

  if (!(await verifyCurrentPassword(profile.username, password))) {
    return { ok: false, message: 'Your current password is not correct.' }
  }

  const { data: available } = await supabaseAdmin.rpc('username_available', { p_username: next })
  if (available === false) return { ok: false, message: 'That username is already taken.' }

  // Login is username@members.local under the hood, so the auth email must move too.
  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email: toEmail(next),
    email_confirm: true,
    user_metadata: { username: next },
  })
  if (authErr) return { ok: false, message: authErr.message }

  const { error } = await supabaseAdmin.from('profiles').update({ username: next }).eq('id', user.id)
  if (error) return { ok: false, message: error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.change_username',
    target_type: 'profile',
    target_id: user.id,
    metadata: { from: profile.username, to: next },
  })

  revalidatePath('/', 'layout')
  return { ok: true, message: `Your username is now @${next}. Use it the next time you sign in.` }
}

export async function changePassword(_prev: Result | null, form: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Not signed in' }

  const current = (form.get('current_password') as string) || ''
  const next = (form.get('new_password') as string) || ''
  const confirm = (form.get('confirm_password') as string) || ''

  if (next.length < 8) return { ok: false, message: 'Use at least 8 characters for the new password.' }
  if (next !== confirm) return { ok: false, message: 'Those new passwords don\u2019t match.' }
  if (next === current) return { ok: false, message: 'Pick a password different from the current one.' }

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  if (!profile) return { ok: false, message: 'Profile not found.' }

  if (!(await verifyCurrentPassword(profile.username, current))) {
    return { ok: false, message: 'Your current password is not correct.' }
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: next })
  if (error) return { ok: false, message: error.message }

  await supabaseAdmin.from('profiles').update({ must_change_password: false }).eq('id', user.id)

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'user.change_password',
    target_type: 'profile',
    target_id: user.id,
  })

  return { ok: true, message: 'Password changed.' }
}
