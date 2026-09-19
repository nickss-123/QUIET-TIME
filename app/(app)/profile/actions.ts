'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const THEMES = ['dawn', 'vesper', 'cedar', 'linen', 'tide', 'ink'] as const
const LOCALES = ['en', 'ko'] as const

type AppearanceState = { ok: false; message: string } | { ok: true }

export async function updateAppearance(
  _prevState: AppearanceState,
  form: FormData
): Promise<AppearanceState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const theme = form.get('theme') as string
  if (!THEMES.includes(theme as any)) {
    return { ok: false, message: 'Pick one of the available themes.' }
  }

  const locale = form.get('locale') as string
  if (!LOCALES.includes(locale as any)) {
    return { ok: false, message: 'Pick one of the available languages.' }
  }

  const accentRaw = ((form.get('accent_color') as string) || '').trim() || null
  if (accentRaw && !/^#[0-9a-fA-F]{6}$/.test(accentRaw)) {
    return { ok: false, message: 'Accent colour needs to be a hex value like #0f766e.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      theme,
      locale,
      accent_color: accentRaw,
      bio: ((form.get('bio') as string) || '').slice(0, 280) || null,
      show_on_leaderboard: form.get('show_on_leaderboard') === 'on',
    })
    .eq('id', user.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}
