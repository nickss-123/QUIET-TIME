import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ENTRY_FIELDS, LEGACY_FIELDS, type FieldDef } from '@/lib/entryFields'
import type { Entry } from '@/lib/types'

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS already limits this to the signed-in member's own rows; the user_id
  // filter is a second guard so this page can never show someone else's entry.
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()

  const entry = data as Entry | null
  if (!entry) notFound()

  const { data: today } = await supabase.rpc('user_today', { p_user: user!.id })

  const answered = (fields: FieldDef[]) =>
    fields
      .map((f) => ({ label: f.label, value: entry[f.key] }))
      .filter((f): f is { label: string; value: string } => typeof f.value === 'string' && f.value.trim() !== '')

  const current = answered(ENTRY_FIELDS[entry.kind])
  const earlier = answered(LEGACY_FIELDS)
  const isToday = entry.entry_date === today

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/logs" className="text-sm text-muted hover:text-ink">{'\u2190'} Past logs</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">
          {entry.kind === 'morning' ? 'Morning devotion' : 'Evening diary'}
        </h1>
        <p className="text-sm text-muted">
          {entry.entry_date}
          {entry.visibility === 'shared_with_admin' && ` ${'\u00b7'} Shared with admin`}
          {entry.is_prayer_request && ` ${'\u00b7'} Prayer request`}
        </p>
      </div>

      <section className="card space-y-5 p-4">
        {current.length === 0 && earlier.length === 0 && (
          <p className="text-sm text-muted">Nothing was written in this entry.</p>
        )}
        {current.map((f) => (
          <Answer key={f.label} label={f.label} value={f.value} />
        ))}
        {entry.mood !== null && <Answer label={'Mood (1\u20135)'} value={String(entry.mood)} />}
      </section>

      {earlier.length > 0 && (
        <section className="card space-y-5 p-4">
          <h2 className="text-sm font-medium text-ink">From an earlier version of this form</h2>
          {earlier.map((f) => (
            <Answer key={f.label} label={f.label} value={f.value} />
          ))}
        </section>
      )}

      {isToday && (
        <Link href={`/${entry.kind}`} className="btn-primary inline-block rounded-lg px-6 py-2 text-sm font-medium">
          Edit today{'\u2019'}s entry
        </Link>
      )}
    </div>
  )
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium text-ink">{label}</h3>
      <p className="whitespace-pre-wrap break-words text-ink">{value}</p>
    </div>
  )
}
