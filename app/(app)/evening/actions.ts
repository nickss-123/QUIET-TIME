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
      holy_spirit_conscious: (form.get('holy_spirit_conscious') as string) || null,
      coram_deo: (form.get('coram_deo') as string) || null,
      one_minute_prayer: (form.get('one_minute_prayer') as string) || null,
      supernatural_joy_peace: (form.get('supernatural_joy_peace') as string) || null,
      holy_spirit_guidance_crisis: (form.get('holy_spirit_guidance_crisis') as string) || null,
      love_endure_forgive: (form.get('love_endure_forgive') as string) || null,
      grace_received: (form.get('grace_received') as string) || null,
      thankful_for: (form.get('thankful_for') as string) || null,
      repent_of: (form.get('repent_of') as string) || null,
      prayer_requests: (form.get('prayer_requests') as string) || null,
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
