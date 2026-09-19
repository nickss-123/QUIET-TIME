import { createClient } from '@/lib/supabase/server'
import EveningForm from './EveningForm'

export default async function EveningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: today } = await supabase.rpc('user_today', { p_user: user!.id })

  const [{ data: entry }, { data: prompt }] = await Promise.all([
    supabase.from('entries').select('*').eq('user_id', user!.id).eq('kind', 'evening').eq('entry_date', today).maybeSingle(),
    supabase.from('prompts').select('body').eq('kind', 'evening').eq('is_active', true).order('id').limit(1).maybeSingle(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-serif text-2xl text-ink">Evening diary</h1>
      <p className="mb-6 text-sm text-muted">{today}</p>
      <EveningForm today={today} entry={entry} prompt={prompt} />
    </div>
  )
}
