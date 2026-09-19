'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toEmail } from '@/lib/username'

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const deactivated = params.get('error') === 'deactivated'

  async function signIn() {
    if (!username || !password) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    setBusy(false)
    if (error) {
      setError('That username and password don\u2019t match. Try again, or ask your admin to reset it.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main data-theme="dawn" className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-serif text-3xl text-ink">Quiet Time</h1>
        <p className="mb-8 text-sm text-muted">Sign in to your journal.</p>

        {deactivated && (
          <p className="mb-4 rounded-lg border border-line bg-surface p-3 text-sm text-ink">
            That account is no longer active. Speak with your admin.
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-muted" htmlFor="username">Username</label>
            <input
              id="username"
              className="w-full rounded-lg px-3 py-2"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && signIn()}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={signIn}
            disabled={busy}
            className="btn-primary w-full rounded-lg py-2 font-medium"
          >
            {busy ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </div>

        <p className="mt-6 text-sm text-muted">
          Accounts are created by your church admin. No self-registration.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
