import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AvatarUpload from '@/components/AvatarUpload'

export default async function PhotoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('id, avatar_path').eq('id', user!.id).single()
  if (!profile) return null

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted hover:text-ink">{'\u2190'} Profile</Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">Photo</h1>
        <p className="text-sm text-muted">Shown next to your name in chats and rankings.</p>
      </div>
      <section className="card space-y-4 p-4">
        <AvatarUpload userId={profile.id} currentPath={profile.avatar_path} />
      </section>
    </div>
  )
}
