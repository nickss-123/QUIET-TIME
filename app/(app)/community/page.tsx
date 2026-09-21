import { createClient } from '@/lib/supabase/server'
import CommunityClient from './CommunityClient'
import type { ChatMessage } from '@/lib/types'

const CHAT_LIMIT = 200

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; group?: string }>
}) {
  const { tab, group } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('id, role, group_id, username, display_name, avatar_path, groups(name)')
    .eq('id', user!.id)
    .single()

  const isAdmin = me?.role === 'admin'
  const myGroup = Array.isArray(me?.groups) ? me?.groups[0] : me?.groups

  // Admins can look into any group's chat; members only ever see their own.
  let groups: { id: string; name: string }[] = []
  if (isAdmin) {
    const { data } = await supabase.from('groups').select('id, name').order('name')
    groups = data ?? []
  }
  const activeGroupId = isAdmin && group ? group : (me?.group_id ?? null)
  const activeGroupName = isAdmin && group
    ? groups.find((g) => g.id === group)?.name ?? null
    : myGroup?.name ?? null

  const profileCols = 'id, body, image_path, is_anonymous, created_at, user_id, channel, group_id, profiles(username, display_name, avatar_path)'

  const [{ data: groupRows }, { data: generalRows }, { data: comments }] = await Promise.all([
    activeGroupId
      ? supabase
          .from('chat_messages')
          .select(profileCols)
          .eq('channel', 'group')
          .eq('group_id', activeGroupId)
          .order('created_at', { ascending: false })
          .limit(CHAT_LIMIT)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('chat_messages')
      .select(profileCols)
      .eq('channel', 'general')
      .order('created_at', { ascending: false })
      .limit(CHAT_LIMIT),
    supabase
      .from('comments')
      .select('id, body, created_at, user_id, parent_id, profiles(display_name, avatar_path)')
      .order('created_at', { ascending: true })
      .limit(300),
  ])

  const one = (p: any) => (Array.isArray(p) ? (p[0] ?? null) : (p ?? null))
  const normalizeChat = (rows: any[] | null): ChatMessage[] =>
    (rows ?? []).map((m) => ({ ...m, profiles: one(m.profiles) })).reverse()

  return (
    <CommunityClient
      tab={tab === 'general' || tab === 'questions' ? tab : 'group'}
      currentUserId={user!.id}
      isAdmin={isAdmin}
      group={activeGroupId ? { id: activeGroupId, name: activeGroupName ?? 'My group' } : null}
      groups={groups}
      groupMessages={normalizeChat(groupRows)}
      generalMessages={normalizeChat(generalRows)}
      comments={(comments ?? []).map((c: any) => ({ ...c, profiles: one(c.profiles) }))}
    />
  )
}
