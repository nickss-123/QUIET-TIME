import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Entry } from '@/lib/types'
import DayView from './DayView'

function prettyDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS already limits this to the signed-in member's own rows; the user_id
  // filter is a second guard so this page can never show someone else's entry.
  const [{ data: rows }, { data: prompts }, { data: pending }] = await Promise.all([
    supabase.from('entries').select('*').eq('user_id', user!.id).eq('entry_date', date),
    supabase.from('prompts').select('kind, body').eq('is_active', true).order('id'),
    supabase
      .from('deletion_requests')
      .select('id, created_at')
      .eq('user_id', user!.id)
      .eq('entry_date', date)
      .eq('status', 'pending')
      .maybeSingle(),
  ])

  const entries = (rows ?? []) as Entry[]
  const morning = entries.find((e) => e.kind === 'morning') ?? null
  const evening = entries.find((e) => e.kind === 'evening') ?? null
  if (!morning && !evening) notFound()

  const promptFor = (kind: 'morning' | 'evening') => (prompts ?? []).find((p: any) => p.kind === kind) ?? null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/logs" className="text-sm text-muted hover:text-ink">{'\u2190'} Past logs</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">{prettyDate(date)}</h1>
        <p className="text-sm text-muted">
          {morning && evening ? 'Morning and evening' : morning ? 'Morning only' : 'Evening only'}
        </p>
      </div>

      <DayView
        date={date}
        morning={morning}
        evening={evening}
        prompts={{ morning: promptFor('morning'), evening: promptFor('evening') }}
        userId={user!.id}
        pendingRequest={pending ?? null}
      />
    </div>
  )
}
