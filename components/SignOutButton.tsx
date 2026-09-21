'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton({ label = 'Sign out' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut()
        router.push('/login')
        router.refresh()
      }}
      className="text-sm text-muted hover:text-ink"
    >
      {label}
    </button>
  )
}
