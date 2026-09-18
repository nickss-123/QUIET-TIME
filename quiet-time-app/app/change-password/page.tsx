'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function submit() {
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('Those passwords don\u2019t match.')

    setBusy(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setBusy(false)
      return setError(pwError.message)
    }

    if (user) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)
    }

    setBusy(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main data-theme="dawn" className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-serif text-2xl text-ink">Set a new password</h1>
        <p className="mb-6 text-sm text-muted">
          You&rsquo;re using a temporary password. Choose one only you know.
        </p>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            className="w-full rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="w-full rounded-lg px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary w-full rounded-lg py-2 font-medium"
          >
            {busy ? 'Saving\u2026' : 'Save and continue'}
          </button>
        </div>
      </div>
    </main>
  )
}
