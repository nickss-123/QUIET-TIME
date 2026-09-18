'use client'

import { useState, useTransition } from 'react'
import { createMember, resetPassword, setActive, createGroup } from './actions'

type Member = {
  id: string
  username: string
  display_name: string
  is_active: boolean
  must_change_password: boolean
  group_id: string | null
  groups: { name: string } | null
}

export default function UsersClient({
  members,
  groups,
}: {
  members: Member[]
  groups: { id: string; name: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [credential, setCredential] = useState<{ username: string; password: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCreate(form: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createMember(form)
      if (!result.ok) return setError(result.message)
      setCredential({ username: result.username, password: result.password })
      ;(document.getElementById('create-form') as HTMLFormElement)?.reset()
    })
  }

  function handleReset(userId: string, username: string) {
    setError(null)
    startTransition(async () => {
      const result = await resetPassword(userId)
      if (!result.ok) return setError(result.message)
      setCredential({ username, password: result.password })
    })
  }

  function handleGroup(form: FormData) {
    startTransition(async () => {
      const result = await createGroup(form)
      if (!result.ok) setError(result.message)
      else (document.getElementById('group-form') as HTMLFormElement)?.reset()
    })
  }

  return (
    <div className="space-y-6">
      {credential && (
        <div className="card space-y-2 border-accent p-4">
          <p className="text-sm font-medium text-ink">
            Share this with {credential.username} once, then close this notice {'\u2014'} it will not be shown again.
          </p>
          <p className="font-mono text-lg text-ink">{credential.password}</p>
          <button onClick={() => setCredential(null)} className="text-sm text-accent underline">
            Done
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="card p-4">
        <h2 className="mb-3 font-serif text-lg text-ink">Add a member</h2>
        <form id="create-form" action={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <input name="username" placeholder="Username" required className="rounded-lg px-3 py-2" />
          <input name="display_name" placeholder="Full name" required className="rounded-lg px-3 py-2" />
          <select name="group_id" className="rounded-lg px-3 py-2 sm:col-span-2">
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button disabled={pending} className="btn-primary rounded-lg py-2 font-medium sm:col-span-2">
            {pending ? 'Creating\u2026' : 'Create account'}
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-serif text-lg text-ink">Groups</h2>
        <form id="group-form" action={handleGroup} className="flex gap-2">
          <input name="name" placeholder="e.g. Young Adults" className="flex-1 rounded-lg px-3 py-2" />
          <button className="btn-primary rounded-lg px-4 py-2 text-sm">Add group</button>
        </form>
      </section>

      <section className="card divide-y divide-line">
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <p className="text-ink">{m.display_name}</p>
              <p className="text-xs text-muted">
                @{m.username}
                {m.groups?.name && ` \u00b7 ${m.groups.name}`}
                {!m.is_active && ' \u00b7 deactivated'}
                {m.must_change_password && ' \u00b7 password not yet changed'}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => handleReset(m.id, m.username)} disabled={pending} className="text-accent underline">
                Reset password
              </button>
              <button
                onClick={() => startTransition(() => setActive(m.id, !m.is_active))}
                disabled={pending}
                className="text-muted underline"
              >
                {m.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="p-4 text-muted">No members yet.</p>}
      </section>
    </div>
  )
}
