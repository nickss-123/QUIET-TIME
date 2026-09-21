import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const [{ data: members }, { data: groups }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, is_active, must_change_password, group_id, groups(name)')
      .eq('role', 'member')
      .order('display_name'),
    supabase.from('groups').select('id, name').order('name'),
  ])

  const normalizedMembers = (members ?? []).map((m: any) => ({
    ...m,
    groups: Array.isArray(m.groups) ? (m.groups[0] ?? null) : (m.groups ?? null),
  }))

  return <UsersClient members={normalizedMembers} groups={groups ?? []} />
}
