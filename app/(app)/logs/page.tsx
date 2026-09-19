import { createClient } from '@/lib/supabase/server'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('entries')
    .select('id, entry_date, kind, scripture_ref, presence_of_god, visibility, is_prayer_request')
    .eq('user_id', user!.id)
    .order('entry_date', { ascending: false })
    .limit(60)

  const byDate = new Map<string, { morning: boolean; evening: boolean }>()
  for (const e of entries ?? []) {
    const row = byDate.get(e.entry_date) ?? { morning: false, evening: false }
    if (e.kind === 'morning') row.morning = true
    if (e.kind === 'evening') row.evening = true
    byDate.set(e.entry_date, row)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-ink">Past logs</h1>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-medium text-ink">Last 60 days</h2>
        <div className="grid grid-cols-10 gap-1 sm:grid-cols-12">
          {Array.from(byDate.entries()).map(([date, v]) => (
            <div
              key={date}
              title={date}
              className="aspect-square rounded"
              style={{
                background:
                  v.morning && v.evening ? 'var(--accent)' :
                  v.morning || v.evening ? 'color-mix(in srgb, var(--accent) 45%, var(--surface))' :
                  'var(--line)',
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Darker means both morning and evening were logged.</p>
      </section>

      <section className="card divide-y divide-line">
        {(entries ?? []).length === 0 && (
          <p className="p-4 text-muted">Nothing logged yet. Your first entry will show up here.</p>
        )}
        {(entries ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm text-ink">
                {e.entry_date} {'\u00b7'} {e.kind === 'morning' ? 'Morning' : 'Evening'}
              </p>
              <p className="text-xs text-muted">
                {e.scripture_ref || (e.presence_of_god ? e.presence_of_god.slice(0, 60) : '')}
              </p>
            </div>
            <div className="flex gap-2 text-xs text-muted">
              {e.visibility === 'shared_with_admin' && <span>Shared</span>}
              {e.is_prayer_request && <span>Prayer request</span>}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
