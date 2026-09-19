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

      <div
