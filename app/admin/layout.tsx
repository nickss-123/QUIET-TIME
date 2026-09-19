import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Members' },
  { href: '/admin/schedule', label: 'Reading schedule' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-line px-3 py-1 text-muted hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
