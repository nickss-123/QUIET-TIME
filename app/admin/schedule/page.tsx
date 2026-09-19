import { createClient } from '@/lib/supabase/server'
import ScheduleUploadForm from './ScheduleUploadForm'

export default async function AdminSchedulePage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('schedule_items')
    .select('id, title, starts_on, ends_on, version, is_published, image_path')
    .order('starts_on', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <ScheduleUploadForm />

      <section className="card divide-y divide-line">
        <h2 className="border-b border-line p-4 font-serif text-lg text-ink">Published plans</h2>
        {(items ?? []).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-ink">{item.title}</p>
              <p className="text-xs text-muted">
                {item.starts_on} {'\u2192'} {item.ends_on} {'\u00b7'} v{item.version}
              </p>
            </div>
            <span className={`text-xs ${item.is_published ? 'text-accent' : 'text-muted'}`}>
              {item.is_published ? 'Live' : 'Replaced'}
            </span>
          </div>
        ))}
        {(items ?? []).length === 0 && <p className="p-4 text-muted">No schedule uploaded yet.</p>}
      </section>
    </div>
  )
}
