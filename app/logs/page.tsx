import OfflineLink from '@/components/OfflineLink'
import { createClient } from '@/lib/supabase/server'
import type { Entry } from '@/lib/types'
import LogsList from './LogsList'

const PAGE_SIZE = 31

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
  const pendingDates = (pending ?? []).map((p) => p.entry_date as string)

  const byDate: Record<string, { morning?: Entry; evening?: Entry }> = {}
  for (const raw of (all ?? []) as unknown as Entry[]) {
    const row = byDate[raw.entry_date] ?? {}
    row[raw.kind] = raw
    byDate[raw.entry_date] = row
  }

  const dates = Object.keys(byDate)
  const totalPages = Math.max(1, Math.ceil(dates.length / PAGE_SIZE))
  const pageDates = dates.slice(from, from + PAGE_SIZE)
  const pageByDate: Record<string, { morning?: Entry; evening?: Entry }> = {}
  for (const d of pageDates) pageByDate[d] = byDate[d]

  return (
    <div className="space-y-6">
      <div>
        <OfflineLink href="/profile" className="text-sm text-muted hover:text-ink">{'\u2190'} Profile</OfflineLink>
        <h1 className="mt-2 font-serif text-2xl text-ink">Past logs</h1>
        <p className="text-sm text-muted">Tap a day to read or edit that day{'\u2019'}s QT.</p>
      </div>

      <LogsList page={page} initialDates={pageDates} initialByDate={pageByDate} pendingDates={pendingDates} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm text-muted">
          {page > 1 ? (
            <OfflineLink href={`/logs?page=${page - 1}`} className="hover:text-ink">{'\u2190'} Newer</OfflineLink>
          ) : <span />}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <OfflineLink href={`/logs?page=${page + 1}`} className="hover:text-ink">Older {'\u2192'}</OfflineLink>
          ) : <span />}
        </nav>
      )}
    </div>
  )
}
