import { createClient } from '@/lib/supabase/server'

export default async function ScheduleViewer() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: item } = await supabase
    .from('schedule_items')
    .select('id, title, image_path, notes')
    .eq('is_published', true)
    .lte('starts_on', today)
    .gte('ends_on', today)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!item) {
    return (
      <section className="rounded-lg border border-dashed border-line p-6 text-center text-muted">
        No reading plan is published yet.
      </section>
    )
  }

  const { data: pub } = supabase.storage.from('schedules').getPublicUrl(item.image_path)

  return (
    <section className="card p-4">
      <h2 className="mb-2 font-serif text-lg text-ink">{item.title}</h2>
      <a href={pub.publicUrl} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pub.publicUrl}
          alt={`Bible reading and quiet time schedule: ${item.title}`}
          className="w-full rounded-lg border border-line"
          loading="lazy"
        />
      </a>
      {item.notes && <p className="mt-2 text-sm text-muted">{item.notes}</p>}
      <p className="mt-1 text-xs text-muted">Tap to open full size.</p>
    </section>
  )
}
