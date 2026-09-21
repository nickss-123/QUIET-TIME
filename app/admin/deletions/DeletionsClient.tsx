'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveDeletion, rejectDeletion } from './actions'

export type Row = {
  id: string
  entry_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  decided_at: string | null
  profiles: { display_name: string; username: string } | null
  kinds: string[]
}

export default function DeletionsClient({ pending, decided }: { pending: Row[]; decided: Row[] }) {
  const [busy, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function act(fn: (id: string) => Promise<{ ok: boolean; message?: string }>, id: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return
    startTransition(async () => {
      const r = await fn(id)
      setError(r.ok ? null : (r as any).message ?? 'Something went wrong')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <section className="card">
        <h2 className="border-b border-line p-4 font-serif text-lg text-ink">
          Waiting for your decision {pending.length > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="p-4 text-muted">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className="font-medium">{r.profiles?.display_name ?? 'Member'}</span>
                    <span className="ml-1 text-sm text-muted">@{r.profiles?.username}</span>
                  </p>
                  <p className="text-sm text-muted">
                    Wants to delete <span className="text-ink">{r.entry_date}</span>
                    {' '}({r.kinds.length ? r.kinds.join(' + ') : 'already empty'})
                    {' \u00b7 '}asked {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.reason && <p className="mt-1 text-sm italic text-muted">{'\u201c'}{r.reason}{'\u201d'}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(approveDeletion, r.id, `Permanently delete ${r.profiles?.display_name}'s entries for ${r.entry_date}?`)}
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Approve & delete
                  </button>
                  <button
                    onClick={() => act(rejectDeletion, r.id)}
                    disabled={busy}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink disabled:opacity-50"
                  >
                    Keep entry
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="border-b border-line p-4 font-serif text-lg text-ink">Recent decisions</h2>
        {decided.length === 0 ? (
          <p className="p-4 text-muted">Nothing decided yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {decided.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                <span className="text-ink">
                  {r.profiles?.display_name ?? 'Member'} {'\u00b7'} {r.entry_date}
                </span>
                <span className={r.status === 'approved' ? 'text-red-600' : 'text-muted'}>
                  {r.status === 'approved' ? 'Deleted' : 'Kept'}
                  {r.decided_at && ` \u00b7 ${new Date(r.decided_at).toLocaleDateString()}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
