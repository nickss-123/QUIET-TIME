import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import type { Theme } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Quiet Time',
  description: 'Daily devotionals and spiritual journaling',
}

const VALID_THEMES: Theme[] = ['dawn', 'vesper', 'cedar', 'linen', 'tide', 'ink']

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let theme: Theme = 'dawn'
  let accent: string | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('theme, accent_color')
      .eq('id', user.id)
      .single()

    if (data?.theme && VALID_THEMES.includes(data.theme as Theme)) {
      theme = data.theme as Theme
    }
    accent = data?.accent_color ?? null
  }

  return (
    <html
      lang="en"
      data-theme={theme}
      style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
    >
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
