import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminOverview() {
  const supabase = await createClient()

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

  const [{ data: engagement }, { count: prayerCount }, { count: deletionCount }] = await Promise.all([
    supabase.rpc('admin_engagement', { p_days: 30 }),
    supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('is_prayer_request', true)
      .gte('entry_date', fourteenDaysAgo),
    supabase
      .from('deletion_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const rows = engagement ?? []
  const quiet = rows.filter((r: any) => r.days_since === null || r.days_since >= 3)
  const activeWeek = rows.filter((r: any) => r.days_since !== null && r.days_since <= 7).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Members" value={rows.length} />
        <Stat label="Active this week" value={activeWeek} />
        <Stat label="Open prayer requests (14d)" value={prayerCount ?? 0} />
        <Link href="/admin/deletions" className="card p-4 hover:bg-bg">
          <p className="text-sm text-muted">Deletion requests waiting</p>
          <p className={'text-3xl tabular-nums ' + ((deletionCount ?? 0) > 0 ? 'text-red-600' : 'text-ink')}>{deletionCount ?? 0}</p>
        </Link>
      </div>

      <section className="card">
        <h2 className="border-b border-line p-4 font-serif text-lg text-ink">Worth a check-in</h2>
        {quiet.length === 0 ? (
          <p className="p-4 text-muted">Everyone has journaled in the last few days.</p>
        ) : (
          <ul className="divide-y divide-line">
            {quiet.map((r: any) => (
              <li key={r.user_id} className="flex justify-between p-4">
                <span className="text-ink">
                  {r.display_name}
                  {r.group_name && <span className="ml-2 text-sm text-muted">{r.group_name}</span>}
                </span>
                <span className="text-sm text-muted">
                  {r.last_entry_on ? `Last entry ${r.days_since} days ago` : 'Has never journaled'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl tabular-nums text-ink">{value}</p>
    </div>
  )
}
