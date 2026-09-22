import OfflineLink from '@/components/OfflineLink'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import SignOutButton from '@/components/SignOutButton'
import { BookIcon, LockIcon, PaletteIcon, CameraIcon } from '@/components/NavIcons'

// A compact profile hub: identity at the top, then a few icons that open
// the detailed sections (past logs, security, appearance, photo).
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path, group_id, groups(name)')
    .eq('id', user!.id)
    .single()

  if (!profile) return null
  const group = Array.isArray(profile.groups) ? profile.groups[0] : profile.groups

  const { count: daysLogged } = await supabase
    .from('entries')
    .select('entry_date', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('kind', 'morning')

  const ITEMS = [
    { href: '/logs', label: 'Past logs', hint: 'Read & edit your QT', Icon: BookIcon },
    { href: '/profile/security', label: 'Password & security', hint: 'Username, password', Icon: LockIcon },
    { href: '/profile/appearance', label: 'Appearance', hint: 'Theme, colours, language', Icon: PaletteIcon },
    { href: '/profile/photo', label: 'Photo', hint: 'Profile picture', Icon: CameraIcon },
  ]

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar path={profile.avatar_path} size={64} />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl text-ink">{profile.display_name}</h1>
          <p className="text-sm text-muted">
            @{profile.username}
            {group?.name && <> {'\u00b7'} {group.name}</>}
          </p>
          <p className="text-xs text-muted">{daysLogged ?? 0} morning {daysLogged === 1 ? 'entry' : 'entries'} logged</p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ITEMS.map(({ href, label, hint, Icon }) => (
          <OfflineLink
            key={href}
            href={href}
            className="card flex flex-col items-center gap-2 p-4 text-center hover:bg-bg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-accent">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-ink">{label}</span>
            <span className="text-xs text-muted">{hint}</span>
          </OfflineLink>
        ))}
      </section>

      <div className="flex justify-center pt-2">
        <SignOutButton />
      </div>
    </div>
  )
}
