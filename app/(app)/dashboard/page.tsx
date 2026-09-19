import { createClient } from '@/lib/supabase/server'
import StreakCard from '@/components/StreakCard'
import ScheduleViewer from '@/components/ScheduleViewer'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, body')
    .eq('is_active', true)
    .lte('starts_on', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">
      {announcements?.map((a) => (
        <div key={a.id} className="rounded-lg border border-line bg-surface p-3 text-sm text-ink">
          {a.body}
        </div>
      ))}

      <StreakCard />
      <ScheduleViewer />
    </div>
  )
}
