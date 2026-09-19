'use client'

import { useActionState, useState, useTransition } from 'react'
import { addComment, deleteComment } from './actions'
import Avatar from '@/components/Avatar'
import SaveButton from '@/components/SaveButton'

type Comment = {
  id: string
  body: string
  created_at: string
  user_id: string
  parent_id: string | null
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  function handleDelete(id: string) {
    startTransition(() => {
      deleteComment(id)
    })
  }

  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id)

  function CommentRow({ c, depth }: { c: Comment; depth: number }) {
    const replies = repliesOf(c.id)
    return (
      <div className={depth > 0 ? 'ml-8 border-l border-line pl-4' : ''}>
        <div className="flex items-start gap-3 py-3">
          <Avatar path={c.profiles?.avatar_path ?? null} size={depth > 0 ? 26 : 32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">{c.profiles?.display_name ?? 'Member'}</p>
              <p className="text-xs text-muted">
                {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
            <div className="mt-2 flex gap-3 text-xs">
              <button
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="text-accent underline"
              >
                {replyingTo === c.id ? 'Cancel' : 'Reply'}
              </button>
              {(c.user_id === currentUserId || isAdmin) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  className="text-muted underline hover:text-ink"
                >
                  Delete
                </button>
              )}
            </div>

            {replyingTo === c.id && (
              <form
                action={(formData) => {
                  formData.set('parent_id', c.id)
                  formAction(formData)
                  setReplyingTo(null)
                }}
                className="mt-3 space-y-2"
              >
                <textarea
                  name="body"
                  rows={2}
                  maxLength={2000}
                  placeholder="Write a reply\u2026"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  required
                  autoFocus
                />
                <SaveButton />
              </form>
            )}
          </div>
        </div>

        {replies.map((r) => (
          <CommentRow key={r.id} c={r} depth={depth + 1} />
        ))}
      </div>
    )
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

      <div className="card divide-y divide-line px-4">
        {topLevel.length === 0 && (
          <p className="py-4 text-muted">No one has posted yet. Be the first to ask or answer something.</p>
        )}
        {topLevel.map((c) => (
          <CommentRow key={c.id} c={c} depth={0} />
        ))}
      </div>
    </div>
  )
}
