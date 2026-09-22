'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import MorningForm from '@/app/(app)/morning/MorningForm'
import EveningForm from '@/app/(app)/evening/EveningForm'
import { ENTRY_FIELDS, LEGACY_FIELDS, type FieldDef } from '@/lib/entryFields'
import type { Entry } from '@/lib/types'
import { requestDeletion, cancelDeletionRequest } from '../actions'
import { listQueue } from '@/lib/offlineQueue'

// One day's QT: the morning and evening entries shown together. Each half is
// readable and, with a tap on "Edit", editable in place using the same form
// the member filled in originally.
export default function DayView({
  date,
  morning,
  evening,
  prompts,
  userId,
  pendingRequest,
}: {
  date: string
  morning: Entry | null
  evening: Entry | null
  prompts: { morning: any; evening: any }
  userId: string
  pendingRequest: { id: string; created_at: string } | null
}) {
  // A morning/evening save made while offline lives only in this device's
  // local queue until it syncs. Merge it over the server copy so this page
  // shows the real, just-saved content instead of "Not logged for this day."
  const [morningEntry, setMorningEntry] = useState(morning)
  const [eveningEntry, setEveningEntry] = useState(evening)

  useEffect(() => {
    const queued = listQueue()
    const qm = queued.find((i) => i.key === `morning:${date}`)
    const qe = queued.find((i) => i.key === `evening:${date}`)
    setMorningEntry(qm ? ({ ...(morning ?? {}), ...qm.payload } as Entry) : morning)
    setEveningEntry(qe ? ({ ...(evening ?? {}), ...qe.payload } as Entry) : evening)
  }, [morning, evening, date])

  return (
    <div className="space-y-6">
      <Section
        title="Morning devotion"
        entry={morningEntry}
        kind="morning"
        editor={(done) => (
          <MorningForm today={date} entry={morningEntry} prompt={prompts.morning} userId={userId} onSaved={done} />
        )}
      />
      <Section
        title="Evening diary"
        entry={eveningEntry}
        kind="evening"
        editor={(done) => (
          <EveningForm today={date} entry={eveningEntry} prompt={prompts.evening} userId={userId} onSaved={done} />
        )}
      />
      <DeleteBox date={date} pendingRequest={pendingRequest} />
    </div>
  )
}

function Section({
  title,
  entry,
  kind,
  editor,
}: {
  title: string
  entry: Entry | null
  kind: 'morning' | 'evening'
  editor: (done: () => void) => React.ReactNode
}) {
  const [editing, setEditing] = useState(false)

  const answered = (fields: FieldDef[]) =>
    entry
      ? fields
          .map((f) => ({ label: f.label, value: entry[f.key] }))
          .filter((f): f is { label: string; value: string } => typeof f.value === 'string' && f.value.trim() !== '')
      : []

  const current = answered(ENTRY_FIELDS[kind])
  const earlier = answered(LEGACY_FIELDS)

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink"
        >
          {editing ? 'Cancel' : entry ? 'Edit' : 'Fill in'}
        </button>
      </div>

      {editing ? (
        editor(() => setEditing(false))
      ) : !entry ? (
        <p className="text-sm text-muted">Not logged for this day.</p>
      ) : (
        <div className="space-y-4">
          {current.length === 0 && earlier.length === 0 && (
            <p className="text-sm text-muted">Nothing was written in this entry.</p>
          )}
          {current.map((f) => (
            <Answer key={f.label} label={f.label} value={f.value} />
          ))}
          {earlier.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-xs text-muted">From an earlier version of this form</p>
              {earlier.map((f) => (
                <Answer key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium text-ink">{label}</h3>
      <p className="whitespace-pre-wrap break-words text-ink">{value}</p>
    </div>
  )
}

function DeleteBox({
  date,
  pendingRequest,
}: {
  date: string
  pendingRequest: { id: string; created_at: string } | null
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    startTransition(async () => {
      const r = await requestDeletion(date, reason)
      setMessage(r.ok ? 'Your request was sent to the admin. This day stays until it is approved.' : r.message)
      if (r.ok) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  function cancel() {
    if (!pendingRequest) return
    startTransition(async () => {
      const r = await cancelDeletionRequest(pendingRequest.id)
      setMessage(r.ok ? 'Request withdrawn.' : r.message)
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-dashed border-line p-4 text-sm">
      {pendingRequest ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-amber-700">
            Deletion requested {'\u2014'} waiting for the admin{'\u2019'}s approval.
          </p>
          <button onClick={cancel} disabled={pending} className="text-muted underline hover:text-ink">
            Withdraw request
          </button>
        </div>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted">Entries are kept permanently. Deleting a day needs the admin{'\u2019'}s approval.</p>
          <button onClick={() => setOpen(true)} className="text-red-600 underline">
            Request deletion
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-ink">Why do you want to delete this day{'\u2019'}s QT? (optional)</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg px-3 py-2 text-sm"
            placeholder="Reason for the admin…"
          />
          <div className="flex gap-2">
            <button onClick={submit} disabled={pending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {pending ? 'Sending…' : 'Send request'}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
    </section>
  )
}
