import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

type MyRank = { rank: number; total_ranked: number; entries_count: number }

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; scope?: string }>
}) {
  const { period = 'month', scope = 'church' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('group_id, show_on_leaderboard')
    .eq('id', user!.id)
    .single()

  const groupFilter = scope === 'group' ? me?.group_id ?? null : null

  const [{ data: board }, { data: rank }] = await Promise.all([
    supabase.rpc('leaderboard', { p_period: period, p_group: groupFilter, p_limit: 50 }),
    supabase.rpc('my_rank', { p_period: period, p_group: groupFilter }).maybeSingle() as Promise<{ data: MyRank | null }>,
  ])

  return (
    <div className="mx-auto
