import type { Metadata, Viewport } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { isThemeId, overridesFromProfile, overridesToStyle } from '@/lib/themes'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'

export const metadata: Metadata = {
  title: 'Quiet Time',
  description: 'A daily spiritual journal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quiet Time',
  },
  icons: {
    icon: [{ url: '/icons/favicon-32.png', sizes: '32x32' }],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#f5b261',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
