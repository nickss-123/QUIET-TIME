'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SunIcon, MoonIcon, ChatIcon, TrophyIcon, UserIcon, HomeIcon, ShieldIcon } from './NavIcons'

export type NavKey = 'today' | 'morning' | 'evening' | 'community' | 'rankings' | 'profile' | 'admin'

const ICONS: Record<NavKey, (p: { className?: string }) => React.ReactElement> = {
  today: HomeIcon,
  morning: SunIcon,
  evening: MoonIcon,
  community: ChatIcon,
  rankings: TrophyIcon,
  profile: UserIcon,
  admin: ShieldIcon,
}

export default function BottomNav({
  items,
}: {
  items: { key: NavKey; href: string; label: string }[]
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-4xl items-stretch justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.key]
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
            (item.key === 'profile' && pathname.startsWith('/logs'))
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] leading-none transition-colors ' +
                  (active ? 'text-accent' : 'text-muted hover:text-ink')
                }
              >
                <Icon className={'h-6 w-6 ' + (active ? 'stroke-[2.2]' : '')} />
                <span className="mt-1 truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
