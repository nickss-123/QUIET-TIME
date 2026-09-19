import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null
  const title = form.get('title') as string
  const startsOn = form.get('starts_on') as string
  const endsOn = form.get('ends_on') as string
  const notes = (form.get('notes') as string) || null

  if (!file || !title || !startsOn || !endsOn) {
    return NextResponse.json({ error: 'Add a file, title, and date range.' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'That file is over 10 MB. Compress it and try again.' }, { status: 400 })
  }

  const { data: previous } = await supabase
    .from('schedule_items')
    .select('version')
    .eq('starts_on', startsOn)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const version = (previous?.version ?? 0) + 1
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `plans/${startsOn}-v${version}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('schedules')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  await supabase
    .from('schedule_items')
    .update({ is_published: false })
    .lte('starts_on', endsOn)
    .gte('ends_on', startsOn)

  const { data: item, error } = await supabase
    .from('schedule_items')
    .insert({
      title,
      image_path: path,
      starts_on: startsOn,
      ends_on: endsOn,
      version,
      notes,
      is_published: true,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'schedule.publish',
    target_type: 'schedule_item',
    target_id: item.id,
    metadata: { path, version },
  })

  return NextResponse.json({ ok: true, item })
}
