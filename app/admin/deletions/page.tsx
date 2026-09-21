import { createClient } from '@/lib/supabase/server'
import DeletionsClient, { type Row } from './DeletionsClient'

export default async function DeletionsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('deletion_requests')
    .select('id, user_id, entry_date, reason, status, created_at, decided_at, profiles(display_name, username)')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []).map((r: any) => ({
    ...r,
    profiles: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null),
    kinds: [] as string[],
  })) as (Row & { user_id: string })[]

  // Which halves of the day still exist, so the admin knows what approving removes.
  const pendingRows = rows.filter((r) => r.status === 'pending')
  if (pendingRows.length > 0) {
    const { data: entries } = await supabase
      .from('entries')
      .select('user_id, entry_date, kind')
      .in('user_id', [...new Set(pendingRows.map((r) => r.user_id))])
      .in('entry_date', [...new Set(pendingRows.map((r) => r.entry_date))])
    for (const r of pendingRows) {
      r.kinds = (entries ?? [])
        .filter((e) => e.user_id === r.user_id && e.entry_date === r.entry_date)
        .map((e) => e.kind)
        .sort()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl text-ink">Deletion requests</h1>
        <p className="text-sm text-muted">
          Members can{'\u2019'}t delete a day{'\u2019'}s QT themselves. Approving removes that day{'\u2019'}s morning and evening entries permanently.
        </p>
      </div>
      <DeletionsClient pending={pendingRows} decided={rows.filter((r) => r.status !== 'pending').slice(0, 30)} />
    </div>
  )
}
