'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type EveningState = { ok: false; message: string } | { ok: true }

export async function saveEveningEntry(
  _prevState: EveningState,
  form: FormData
): Promise<EveningState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data: today } = await supabase.rpc('user_today', { p_user: user.id })
  const entryDate = (form.get('entry_date') as string) || today

  const { error } = await supabase.from('entries').upsert(
    {
      user_id: user.id,
      entry_date: entryDate,
      kind: 'evening',
      presence_of_god: (form.get('presence_of_god') as string) || null,
      blessings: (form.get('blessings') as string) || null,
      growth: (form.get('growth') as string) || null,
      struggles: (form.get('struggles') as string) || null,
      mood: form.get('mood') ? Number(form.get('mood')) : null,
      visibility: form.get('visibility') === 'shared_with_admin' ? 'shared_with_admin' : 'private',
      is_prayer_request: form.get('prayer_request') === 'on',
    },
    { onConflict: 'user_id,entry_date,kind' }
  )

  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/logs')
  revalidatePath('/rankings')
  return { ok: true }
}
