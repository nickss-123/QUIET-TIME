'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  COLOR_KEYS,
  COLOR_LABELS,
  THEME_COLORS,
  isThemeId,
  normalizeHex,
  type ColorKey,
  type Colors,
} from '@/lib/themes'
import { readabilityIssues } from '@/lib/contrast'

const LOCALES = ['en', 'ko'] as const

type AppearanceState = { ok: false; message: string } | { ok: true; saved?: true }

export async function updateAppearance(
  _prevState: AppearanceState,
  form: FormData
): Promise<AppearanceState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const theme = form.get('theme') as string
  if (!isThemeId(theme)) {
    return { ok: false, message: 'Pick one of the available themes.' }
  }

  const locale = form.get('locale') as string
  if (!LOCALES.includes(locale as any)) {
    return { ok: false, message: 'Pick one of the available languages.' }
  }

  // Colour overrides: one `color_<key>` field per colour, blank = use the theme's own.
  const overrides: Partial<Colors> = {}
  for (const key of COLOR_KEYS) {
    const raw = ((form.get(`color_${key}`) as string) || '').trim()
    if (!raw) continue
    const hex = normalizeHex(raw)
    if (!hex) {
      return { ok: false, message: `${COLOR_LABELS[key].label} needs to be a hex value like #0f766e.` }
    }
    overrides[key] = hex
  }

  const changed = Object.keys(overrides) as ColorKey[]
  const effective: Colors = { ...THEME_COLORS[theme], ...overrides }
  const blocking = readabilityIssues(effective, changed).find((i) => i.level === 'error')
  if (blocking) return { ok: false, message: blocking.message }

  const { accent, ...customColors } = overrides

  const { error } = await supabase
    .from('profiles')
    .update({
      theme,
      locale,
      accent_color: accent ?? null,
      custom_colors: customColors,
      bio: ((form.get('bio') as string) || '').slice(0, 280) || null,
      show_on_leaderboard: form.get('show_on_leaderboard') === 'on',
    })
    .eq('id', user.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/', 'layout')
  return { ok: true, saved: true }
}
