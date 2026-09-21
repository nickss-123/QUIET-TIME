'use client'

import { useActionState } from 'react'
import SaveButton from '@/components/SaveButton'
import { changeUsername, changePassword } from './actions'

function Notice({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null
  return (
    <p className={'rounded-lg p-2 text-sm ' + (state.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
      {state.message}
    </p>
  )
}

export function UsernameForm({ username }: { username: string }) {
  const [state, action] = useActionState(changeUsername, null)
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-sm font-medium text-ink">Username</h2>
      <p className="text-xs text-muted">You sign in with this. Current: <span className="text-ink">@{username}</span></p>
      <Notice state={state} />
      <div>
        <label htmlFor="username" className="mb-1 block text-sm text-ink">New username</label>
        <input id="username" name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]+" autoCapitalize="none" autoComplete="username" className="w-full rounded-lg px-3 py-2" />
      </div>
      <div>
        <label htmlFor="u_current_password" className="mb-1 block text-sm text-ink">Current password</label>
        <input id="u_current_password" name="current_password" type="password" required autoComplete="current-password" className="w-full rounded-lg px-3 py-2" />
      </div>
      <SaveButton label="Change username" />
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null)
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-sm font-medium text-ink">Password</h2>
      <Notice state={state} />
      <div>
        <label htmlFor="current_password" className="mb-1 block text-sm text-ink">Current password</label>
        <input id="current_password" name="current_password" type="password" required autoComplete="current-password" className="w-full rounded-lg px-3 py-2" />
      </div>
      <div>
        <label htmlFor="new_password" className="mb-1 block text-sm text-ink">New password</label>
        <input id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-lg px-3 py-2" />
      </div>
      <div>
        <label htmlFor="confirm_password" className="mb-1 block text-sm text-ink">Confirm new password</label>
        <input id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-lg px-3 py-2" />
      </div>
      <SaveButton label="Change password" />
    </form>
  )
}
