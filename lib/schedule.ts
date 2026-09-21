import { createClient } from '@/lib/supabase/server'

export type CurrentSchedule = { title: string; url: string; notes: string | null } | null

// The currently published reading schedule image, or null if none is live today.
export async function getCurrentSchedule(): Promise<CurrentSchedule> {
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

  if (!item) return null
  const { data: pub } = supabase.storage.from('schedules').getPublicUrl(item.image_path)
  return { title: item.title, url: pub.publicUrl, notes: item.notes ?? null }
}
