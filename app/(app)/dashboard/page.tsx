import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StreakCard from '@/components/StreakCard'
import ScheduleViewer from '@/components/ScheduleViewer'
import type { Announcement } from '@/types/announcement'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  // The Today overview is for the admin only; members go straight to their morning form.
  if (me?.role !== 'admin') redirect('/morning')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, body')
    .eq('is_active', true)
    .lte('starts_on', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })
    .limit(3)
    .returns<Announcement[]>()

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
