import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Members' },
  { href: '/admin/schedule', label: 'Reading schedule' },
  { href: '/admin/deletions', label: 'Deletion requests' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-line px-3 py-1 text-muted hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
