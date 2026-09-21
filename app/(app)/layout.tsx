import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import OfflineSyncBanner from '@/components/OfflineSyncBanner'
import BottomNav, { type NavKey } from '@/components/BottomNav'
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
  const isAdmin = profile?.role === 'admin'

  // The "Today" overview is admin-only now. Members land on Morning.
  // Past logs lives inside Profile, so it no longer needs its own tab.
  const NAV: { key: NavKey; href: string; label: string }[] = [
    ...(isAdmin ? [{ key: 'today' as const, href: '/dashboard', label: dict.nav.today }] : []),
    { key: 'morning', href: '/morning', label: dict.nav.morning },
    { key: 'evening', href: '/evening', label: dict.nav.evening },
    { key: 'community', href: '/community', label: dict.nav.community },
    { key: 'rankings', href: '/rankings', label: dict.nav.rankings },
    { key: 'profile', href: '/profile', label: dict.nav.profile },
    ...(isAdmin ? [{ key: 'admin' as const, href: '/admin', label: dict.nav.admin }] : []),
  ]

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href={isAdmin ? '/dashboard' : '/morning'} className="font-serif text-lg text-ink">Quiet Time</Link>
          <Link href="/profile" className="flex items-center gap-2" aria-label={dict.nav.profile}>
            <span className="hidden text-sm text-ink sm:inline">{profile?.display_name}</span>
            <Avatar path={profile?.avatar_path ?? null} size={28} />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 pb-28">
        <OfflineSyncBanner />
        {children}
      </main>
      <BottomNav items={NAV} />
    </div>
  )
}
