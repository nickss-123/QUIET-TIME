import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UsernameForm, PasswordForm } from './SecurityForms'

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user!.id).single()
  if (!profile) return null

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted hover:text-ink">{'\u2190'} Profile</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">Password &amp; security</h1>
        <p className="text-sm text-muted">Change your username or password any time. Both need your current password.</p>
      </div>
      <UsernameForm username={profile.username} />
      <PasswordForm />
    </div>
  )
}
