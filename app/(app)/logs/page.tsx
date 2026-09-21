import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { previewOf } from '@/lib/entryFields'
import type { Entry } from '@/lib/types'
import { SunIcon, MoonIcon } from '@/components/NavIcons'

const PAGE_SIZE = 31

function prettyDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Every day the member has ever logged, newest first. A day's morning and
// evening entries are combined into one row; entries are kept forever and
// can only be removed through an admin-approved deletion request.
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

  // Distinct days, paged. entry_date is the grouping key so both kinds fold into one row.
  const { data: all } = await supabase
    .from('entries')
    .select('id, entry_date, kind, scripture_ref, scripture_text, observation, application, prayer_points, grace_received, thankful_for, repent_of, prayer_requests, presence_of_god, blessings, updated_at')
    .eq('user_id', user!.id)
    .order('entry_date', { ascending: false })

  const { data: pending } = await supabase
    .from('deletion_requests')
    .select('entry_date')
    .eq('user_id', user!.id)
    .eq('status', 'pending')
  const pendingDates = new Set((pending ?? []).map((p) => p.entry_date as string))

  const byDate = new Map<string, { morning?: Entry; evening?: Entry }>()
  for (const raw of (all ?? []) as unknown as Entry[]) {
    const row = byDate.get(raw.entry_date) ?? {}
    row[raw.kind] = raw
    byDate.set(raw.entry_date, row)
  }

  const dates = [...byDate.keys()]
  const totalPages = Math.max(1, Math.ceil(dates.length / PAGE_SIZE))
  const pageDates = dates.slice(from, from + PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted hover:text-ink">{'\u2190'} Profile</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">Past logs</h1>
        <p className="text-sm text-muted">Tap a day to read or edit that day{'\u2019'}s QT.</p>
      </div>

      <section className="card divide-y divide-line">
        {pageDates.length === 0 && (
          <p className="p-4 text-muted">
            {page > 1 ? 'No entries on this page.' : 'Nothing logged yet. Your first entry will show up here.'}
          </p>
        )}
        {pageDates.map((date) => {
          const day = byDate.get(date)!
          const preview = day.morning ? previewOf(day.morning) : day.evening ? previewOf(day.evening) : ''
          return (
            <Link
              key={date}
              href={`/logs/${date}`}
              className="flex items-center justify-between gap-3 p-3 hover:bg-bg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{prettyDate(date)}</p>
                <p className="truncate text-xs text-muted">{preview || 'Open to read'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
                {pendingDates.has(date) && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Delete requested</span>
                )}
                <span title="Morning" className={day.morning ? 'text-accent' : 'opacity-25'}>
                  <SunIcon className="h-5 w-5" />
                </span>
                <span title="Evening" className={day.evening ? 'text-accent' : 'opacity-25'}>
                  <MoonIcon className="h-5 w-5" />
                </span>
              </div>
            </Link>
          )
        })}
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
