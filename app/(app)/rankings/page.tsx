import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; scope?: string }>
}) {
  const { period = 'month', scope = 'church' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('group_id, show_on_leaderboard')
    .eq('id', user!.id)
    .single()

  const groupFilter = scope === 'group' ? me?.group_id ?? null : null

  const [{ data: board }, { data: rank }] = await Promise.all([
    supabase.rpc('leaderboard', { p_period: period, p_group: groupFilter, p_limit: 50 }),
    supabase.rpc('my_rank', { p_period: period, p_group: groupFilter }).maybeSingle(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-2xl text-ink">Rankings</h1>
        <nav className="flex gap-1 text-sm">
          {['week', 'month', 'year'].map((p) => (
            <a
              key={p}
              href={`/rankings?period=${p}&scope=${scope}`}
              className={`rounded-full px-3 py-1 ${p === period ? 'btn-primary' : 'text-muted'}`}
            >
              This {p}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex gap-2 text-sm">
        {['church', 'group'].map((s) => (
          <a
            key={s}
            href={`/rankings?period=${period}&scope=${s}`}
            className={`rounded-lg border border-line px-3 py-1 ${s === scope ? 'bg-surface text-ink' : 'text-muted'}`}
          >
            {s === 'church' ? 'Whole church' : 'My group'}
          </a>
        ))}
      </div>

      {rank && (
        <p className="card p-4 text-ink">
          You&rsquo;re {ordinal(Number(rank.rank))} of {rank.total_ranked}, with{' '}
          {rank.entries_count} {rank.entries_count === 1 ? 'entry' : 'entries'} this {period}.
        </p>
      )}

      <ol className="card divide-y divide-line">
        {(board ?? []).map((r: any) => (
          <li key={r.user_id} className={`flex items-center gap-3 p-3 ${r.is_me ? 'bg-bg' : ''}`}>
            <span className="w-8 text-right tabular-nums text-muted">{r.rank}</span>
            <Avatar path={r.avatar_path} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink">{r.display_name}</p>
              {r.group_name && <p className="text-xs text-muted">{r.group_name}</p>}
            </div>
            <div className="text-right">
              <p className="tabular-nums text-ink">{r.entries_count}</p>
              <p className="text-xs text-muted">
                {Math.max(r.morning_streak, r.evening_streak)}-day streak
              </p>
            </div>
          </li>
        ))}
        {(board ?? []).length === 0 && (
          <li className="p-4 text-muted">Nobody has logged an entry in this period yet.</li>
        )}
      </ol>

      {me && !me.show_on_leaderboard && (
        <p className="text-sm text-muted">
          You&rsquo;re hidden from other members&rsquo; rankings. Only you see your row.
          Change this in your profile.
        </p>
      )}
    </div>
  )
}
