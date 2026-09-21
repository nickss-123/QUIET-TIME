'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MorningState = { ok: false; message: string } | { ok: true }

export async function saveMorningEntry(
  _prevState: MorningState,
  form: FormData
): Promise<MorningState> {
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data: today } = await supabase.rpc('user_today', { p_user: user.id })
  const entryDate = (form.get('entry_date') as string) || today

  const { error } = await supabase.from('entries').upsert(
    {
      user_id: user.id,
      entry_date: entryDate,
      kind: 'morning',
      scripture_ref: (form.get('scripture_ref') as string) || null,
      scripture_text: (form.get('scripture_text') as string) || null,
      observation: (form.get('observation') as string) || null,
      application: (form.get('application') as string) || null,
      prayer_points: (form.get('prayer_points') as string) || null,
      mood: form.get('mood') ? Number(form.get('mood')) : null,
      visibility: form.get('visibility') === 'shared_with_admin' ? 'shared_with_admin' : 'private',
      is_prayer_request: form.get('prayer_request') === 'on',
    },
    { onConflict: 'user_id,entry_date,kind' }
  )

  if (error) return { ok: false as const, message: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/logs')
  revalidatePath('/rankings')
  return { ok: true as const }
}
