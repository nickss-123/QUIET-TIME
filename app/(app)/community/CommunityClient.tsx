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
  const repliesOf = (id: string) => comments.filter((c)
