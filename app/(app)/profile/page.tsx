import { createClient } from '@/lib/supabase/server'
import AvatarUpload from '@/components/AvatarUpload'
import AppearanceForm from './AppearanceForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile) return null

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-ink">{profile.display_name}</h1>
        <p className="text-sm text-muted">@{profile.username}</p>
      </div>

      <section className="card space-y-4 p-4">
        <h2 className="text-sm font-medium text-ink">Photo</h2>
        <AvatarUpload userId={profile.id} currentPath={profile.avatar_path} />
      </section>

      <AppearanceForm profile={profile} />
    </div>
  )
}
