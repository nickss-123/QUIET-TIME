import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/SignOutButton'
import Avatar from '@/components/Avatar'

const NAV = [
  { href: '/dashboard', label: 'Today' },
  { href: '/morning', label: 'Morning' },
  { href: '/evening', label: 'Evening' },
  { href: '/logs', label: 'Past logs' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/profile', label: 'Profile' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { display_name: string; avatar_path: string | null; role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_path, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-serif text-lg text-ink">Quiet Time</Link>
          <div className="flex items-center gap-3">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-muted hover:text-ink">Admin</Link>
            )}
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar path={profile?.avatar_path ?? null} size={28} />
              <span className="hidden text-sm text-ink sm:inline">{profile?.display_name}</span>
            </Link>
            <SignOutButton />
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
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
