'use client'

import { useActionState, useTransition } from 'react'
import { addComment, deleteComment } from './actions'
import Avatar from '@/components/Avatar'
import SaveButton from '@/components/SaveButton'

type Comment = {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles: { display_name: string; avatar_path: string | null } | null
}

const initialState = { ok: true as const }

export default function CommunityClient({
  comments,
  currentUserId,
  isAdmin,
}: {
  comments: Comment[]
  currentUserId: string
  isAdmin: boolean
}) {
  const [state, formAction] = useActionState(addComment, initialState)
  const [pending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(() => {
      deleteComment(id)
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-ink">Community</h1>

      <form action={formAction} className="card space-y-3 p-4">
        {!state.ok && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
        )}
        <textarea
          name="body"
          rows={3}
          maxLength={2000}
          placeholder="Ask a question or share an answer\u2026"
          className="w-full rounded-lg px-3 py-2"
          required
        />
        <SaveButton />
      </form>

      <div className="card divide-y divide-line">
        {comments.length === 0 && (
          <p className="p-4 text-muted">No one has posted yet. Be the first to ask or answer something.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-4">
            <Avatar path={c.profiles?.avatar_path ?? null} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{c.profiles?.display_name ?? 'Member'}</p>
                <p className="text-xs text-muted">
                  {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
              {(c.user_id === currentUserId || isAdmin) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  className="mt-2 text-xs text-muted underline hover:text-ink"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
