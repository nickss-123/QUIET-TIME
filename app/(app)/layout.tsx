import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { isThemeId, overridesFromProfile, overridesToStyle } from '@/lib/themes'

export const metadata: Metadata = {
  title: 'Quiet Time',
  description: 'A daily spiritual journal',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Apply the signed-in member's saved theme and colour overrides on the server,
  // so every page (including /admin) renders in their colours with no flash.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let theme = 'dawn'
  let style: React.CSSProperties | undefined
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('theme, accent_color, custom_colors')
      .eq('id', user.id)
      .maybeSingle()
    if (data) {
      if (isThemeId(data.theme)) theme = data.theme
      style = overridesToStyle(overridesFromProfile(data.accent_color, data.custom_colors))
    }
  }

  return (
    <html lang="en" data-theme={theme} style={style}>
      <body>{children}</body>
    </html>
  )
}
