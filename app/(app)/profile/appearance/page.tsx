import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppearanceForm from '../AppearanceForm'

export default async function AppearancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  if (!profile) return null

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted hover:text-ink">{'\u2190'} Profile</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">Appearance</h1>
      </div>
      <AppearanceForm profile={profile} />
    </div>
  )
}
