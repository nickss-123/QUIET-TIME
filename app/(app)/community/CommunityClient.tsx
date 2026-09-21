'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addComment, deleteComment, sendChat, deleteChat } from './actions'
import Avatar from '@/components/Avatar'
import SaveButton from '@/components/SaveButton'
import ChatSendButton from '@/components/ChatSendButton'
import type { ChatMessage } from '@/lib/types'

type Comment = {
  id: string
  body: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: { display_name: string; avatar_path: string | null } | null
}

type Tab = 'group' | 'general' | 'questions'

const initialState = { ok: true as const }
const STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const REFRESH_MS = 15_000

export default function CommunityClient({
  tab: initialTab,
  currentUserId,
  isAdmin,
  group,
  groups,
  groupMessages,
  generalMessages,
  comments,
}: {
  tab: Tab
  currentUserId: string
  isAdmin: boolean
  group: { id: string; name: string } | null
  groups: { id: string; name: string }[]
  groupMessages: ChatMessage[]
  generalMessages: ChatMessage[]
  comments: Comment[]
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const router = useRouter()

  // Light polling keeps chats fresh without a realtime subscription.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) router.refresh()
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [router])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'group', label: group ? group.name : 'My group' },
    { key: 'general', label: 'General' },
    { key: 'questions', label: 'Questions' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl text-ink">Community</h1>

      <div role="tablist" className="flex gap-1 rounded-full border border-line bg-surface p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key)
              window.history.replaceState(null, '', `/community?tab=${t.key}${group && isAdmin ? `&group=${group.id}` : ''}`)
            }}
            className={
              'flex-1 truncate rounded-full px-3 py-1.5 transition-colors ' +
              (tab === t.key ? 'bg-accent font-medium text-white' : 'text-muted hover:text-ink')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'group' && (
        <>
          {isAdmin && groups.length > 0 && (
            <select
              value={group?.id ?? ''}
              onChange={(e) => router.push(`/community?tab=group&group=${e.target.value}`)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              aria-label="Choose a group"
            >
              <option value="" disabled>Choose a group to view</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          {group ? (
            <ChatRoom
              key={`group-${group.id}`}
              channel="group"
              groupId={group.id}
              title={group.name}
              subtitle="Only members of this group can see and post here."
              messages={groupMessages}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ) : (
            <p className="card p-4 text-sm text-muted">
              You{'\u2019'}re not in a group yet. Ask the admin to add you to one and your group chat will appear here.
            </p>
          )}
        </>
      )}

      {tab === 'general' && (
        <ChatRoom
          key="general"
          channel="general"
          title="General"
          subtitle="Everyone can chat here. You can post as yourself or anonymously."
          messages={generalMessages}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          allowAnonymous
        />
      )}

      {tab === 'questions' && (
        <Questions comments={comments} currentUserId={currentUserId} isAdmin={isAdmin} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat room (group + general)
// ---------------------------------------------------------------------------

function ChatRoom({
  channel,
  groupId,
  title,
  subtitle,
  messages,
  currentUserId,
  isAdmin,
  allowAnonymous = false,
}: {
  channel: 'group' | 'general'
  groupId?: string
  title: string
  subtitle: string
  messages: ChatMessage[]
  currentUserId: string
  isAdmin: boolean
  allowAnonymous?: boolean
}) {
  const [state, formAction] = useActionState(sendChat, initialState)
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(messages.length)

  useEffect(() => {
    // Scroll to the newest message on first load and when new ones arrive.
    if (messages.length !== lastCount.current || lastCount.current === messages.length) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
    }
    lastCount.current = messages.length
  }, [messages.length])

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
      setPreview(null)
    }
  }, [state])

  function remove(id: string) {
    if (!confirm('Delete this message?')) return
    startTransition(() => {
      deleteChat(id)
    })
  }

  return (
    <section className="card flex flex-col">
      <header className="border-b border-line px-4 py-3">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </header>

      <div className="max-h-[55dvh] min-h-[240px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === currentUserId
          const hidden = m.is_anonymous && !mine && !isAdmin
          const name = hidden ? 'Anonymous' : (m.profiles?.username ? `@${m.profiles.username}` : 'Member')
          const displayName = hidden ? null : m.profiles?.display_name
          return (
            <div key={m.id} className={'flex items-end gap-2 ' + (mine ? 'flex-row-reverse' : '')}>
              {hidden ? (
                <div className="h-7 w-7 shrink-0 rounded-full border border-line bg-bg" title="Anonymous" />
              ) : (
                <Avatar path={m.profiles?.avatar_path ?? null} size={28} />
              )}
              <div className={'max-w-[78%] ' + (mine ? 'items-end text-right' : '')}>
                <p className="mb-0.5 text-[11px] text-muted">
                  <span className="font-medium text-ink">{name}</span>
                  {displayName && displayName !== m.profiles?.username && <> {'\u00b7'} {displayName}</>}
                  {m.is_anonymous && (mine || isAdmin) && <> {'\u00b7'} posted anonymously</>}
                  {' \u00b7 '}
                  {new Date(m.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
                <div
                  className={
                    'inline-block rounded-2xl px-3 py-2 text-left text-sm ' +
                    (mine ? 'rounded-br-sm bg-accent text-white' : 'rounded-bl-sm border border-line bg-bg text-ink')
                  }
                >
                  {m.image_path && (
                    <a href={`${STORAGE_BASE}/storage/v1/object/public/chat-images/${m.image_path}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${STORAGE_BASE}/storage/v1/object/public/chat-images/${m.image_path}`}
                        alt="Shared photo"
                        loading="lazy"
                        className={'max-h-64 rounded-lg object-cover ' + (m.body ? 'mb-2' : '')}
                      />
                    </a>
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                </div>
                {(mine || isAdmin) && (
                  <button
                    onClick={() => remove(m.id)}
                    disabled={pending}
                    className="mt-0.5 text-[11px] text-muted underline hover:text-ink"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={formAction} className="space-y-2 border-t border-line p-3">
        <input type="hidden" name="channel" value={channel} />
        {groupId && <input type="hidden" name="group_id" value={groupId} />}
        {!state.ok && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
        )}
        {preview && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-bg"
              aria-label="Remove photo"
            >
              {'\u00d7'}
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-muted hover:text-ink" title="Attach a photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-9 8" />
            </svg>
            <input
              ref={fileRef}
              type="file"
              name="image"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setPreview(f ? URL.createObjectURL(f) : null)
              }}
            />
          </label>
          <textarea
            name="body"
            rows={1}
            maxLength={2000}
            placeholder={anonymous ? 'Message as Anonymous…' : 'Message…'}
            className="min-h-[44px] w-full flex-1 resize-none rounded-lg px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
          />
          <ChatSendButton />
        </div>
        {allowAnonymous && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              name="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 min-h-0"
            />
            Hide my identity (post as Anonymous)
          </label>
        )}
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Questions (threaded Q&A)
// ---------------------------------------------------------------------------

function Questions({
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

  const topLevel = [...comments.filter((c) => !c.parent_id)].reverse()
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
                {replyingTo === c.id ? 'Cancel' : depth === 0 ? 'Answer' : 'Reply'}
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
                  placeholder="Write a reply…"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  required
                  autoFocus
                />
                <SaveButton label="Post reply" />
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
    <div className="space-y-4">
      <form action={formAction} className="card space-y-3 p-4">
        <h2 className="font-serif text-lg text-ink">Questions</h2>
        <p className="text-xs text-muted">Ask anything about faith, the reading plan, or your quiet time. Anyone can answer.</p>
        {!state.ok && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
        )}
        <textarea
          name="body"
          rows={3}
          maxLength={2000}
          placeholder="Ask a question…"
          className="w-full rounded-lg px-3 py-2"
          required
        />
        <SaveButton label="Post question" />
      </form>

      <div className="card divide-y divide-line px-4">
        {topLevel.length === 0 && (
          <p className="py-4 text-muted">No questions yet. Be the first to ask.</p>
        )}
        {topLevel.map((c) => (
          <CommentRow key={c.id} c={c} depth={0} />
        ))}
      </div>
    </div>
  )
}
