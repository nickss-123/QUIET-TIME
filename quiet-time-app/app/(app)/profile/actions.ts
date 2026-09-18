'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const THEMES = ['dawn', 'vesper', 'cedar', 'linen', 'tide', 'ink'] as const

export async function updateAppearance(form: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const theme = form.get('theme') as string
  if (!THEMES.includes(theme as any)) {
    return { ok: false as const, message: 'Pick one of the available themes.' }
  }

  const accentRaw = ((form.get('accent_color') as string) || '').trim() || null
  if (accentRaw && !/^#[0-9a-fA-F]{6}$/.test(accentRaw)) {
    return { ok: false as const, message: 'Accent colour needs to be a hex value like #0f766e.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      theme,
      accent_color: accentRaw,
      bio: ((form.get('bio') as string) || '').slice(0, 280) || null,
      show_on_leaderboard: form.get('show_on_leaderboard') === 'on',
    })
    .eq('id', user.id)

  if (error) return { ok: false as const, message: error.message }

  revalidatePath('/', 'layout')
  return { ok: true as const }
}
