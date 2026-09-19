import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { previewOf } from '@/lib/entryFields'
import type { Entry } from '@/lib/types'

const PAGE_SIZE = 30
const HEATMAP_DAYS = 60

function lastDays(today: string, n: number): string[] {
  const end = new Date(`${today}T00:00:00Z`)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end)
    d.setUTCDate(end.getUTCDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: todayRaw } = await supabase.rpc('user_today', { p_user: user!.id })
  const today = (todayRaw as string | null) ?? new Date().toISOString().slice(0, 10)
  const days = lastDays(today, HEATMAP_DAYS)

  const [{ data: list, count }, { data: recent }] = await Promise.all([
    // Every entry the member has ever saved, newest first, a page at a time.
    supabase
      .from('entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('entry_date', { ascending: false })
      .order('kind', { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    // The heatmap only needs dates and kinds for the last 60 days.
    supabase
      .from('entries')
      .select('entry_date, kind')
      .eq('user_id', user!.id)
      .gte('entry_date', days[0]),
  ])

  const entries = (list ?? []) as Entry[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const byDate = new Map<string, { morning: boolean; evening: boolean }>()
  for (const e of recent ?? []) {
    const row = byDate.get(e.entry_date) ?? { morning: false, evening: false }
    if (e.kind === 'morning') row.morning = true
    if (e.kind === 'evening') row.evening = true
    byDate.set(e.entry_date, row)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-ink">Past logs</h1>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-medium text-ink">Last {HEATMAP_DAYS} days</h2>
        <div className="grid grid-cols-10 gap-1 sm:grid-cols-12">
          {days.map((date) => {
            const v = byDate.get(date)
            return (
              <div
                key={date}
                title={date}
                className="aspect-square rounded"
                style={{
                  background:
                    v?.morning && v?.evening ? 'var(--accent)' :
                    v?.morning || v?.evening ? 'color-mix(in srgb, var(--accent) 45%, var(--surface))' :
                    'var(--line)',
                }}
              />
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">Darker means both morning and evening were logged.</p>
      </section>

      <section className="card divide-y divide-line">
        {entries.length === 0 && (
          <p className="p-4 text-muted">
            {page > 1 ? 'No entries on this page.' : 'Nothing logged yet. Your first entry will show up here.'}
          </p>
        )}
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/logs/${e.id}`}
            className="flex items-center justify-between gap-3 p-3 hover:bg-bg"
          >
            <div className="min-w-0">
              <p className="text-sm text-ink">
                {e.entry_date} {'\u00b7'} {e.kind === 'morning' ? 'Morning' : 'Evening'}
              </p>
              <p className="truncate text-xs text-muted">{previewOf(e)}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs text-muted">
              {e.visibility === 'shared_with_admin' && <span>Shared</span>}
              {e.is_prayer_request && <span>Prayer request</span>}
            </div>
          </Link>
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm text-muted">
          {page > 1 ? (
            <Link href={`/logs?page=${page - 1}`} className="hover:text-ink">{'\u2190'} Newer</Link>
          ) : <span />}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/logs?page=${page + 1}`} className="hover:text-ink">Older {'\u2192'}</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  )
}
