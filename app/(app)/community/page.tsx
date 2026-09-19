import { createClient } from '@/lib/supabase/server'
import CommunityClient from './CommunityClient'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, created_at, user_id, parent_id, profiles(display_name, avatar_path)')
    .order('created_at', { ascending: true })
    .limit(300)

  const normalized = (comments ?? []).map((c: any) => ({
    ...c,
    profiles: Array.isArray(c.profiles) ? (c.profiles[0] ?? null) : (c.profiles ?? null),
  }))

  return (
    <CommunityClient
      comments={normalized}
      currentUserId={user!.id}
      isAdmin={me?.role === 'admin'}
    />
  )
}
