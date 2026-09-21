import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/SignOutButton'
import Avatar from '@/components/Avatar'
import OfflineSyncBanner from '@/components/OfflineSyncBanner'
import { getDictionary } from '@/lib/i18n/dictionary'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { display_name: string; avatar_path: string | null; role: string; locale: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_path, role, locale')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const dict = getDictionary(profile?.locale ?? 'en')

  const NAV = [
    { href: '/dashboard', label: dict.nav.today },
    { href: '/morning', label: dict.nav.morning },
    { href: '/evening', label: dict.nav.evening },
    { href: '/logs', label: dict.nav.pastLogs },
    { href: '/community', label: dict.nav.community },
    { href: '/rankings', label: dict.nav.rankings },
    { href: '/profile', label: dict.nav.profile },
  ]

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-serif text-lg text-ink">Quiet Time</Link>
          <div className="flex items-center gap-3">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-muted hover:text-ink">{dict.nav.admin}</Link>
            )}
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar path={profile?.avatar_path ?? null} size={28} />
              <span className="hidden text-sm text-ink sm:inline">{profile?.display_name}</span>
            </Link>
            <SignOutButton label={dict.common.signOut} />
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1 text-muted hover:bg-bg hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <OfflineSyncBanner />
        {children}
      </main>
    </div>
  )
}
