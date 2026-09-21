'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { queueEntry, isNetworkError, listQueue } from '@/lib/offlineQueue'
import SaveButton from '@/components/SaveButton'
import QtCalendar from '@/components/QtCalendar'

type State = { ok: true; offline?: boolean; saved?: boolean } | { ok: false; message: string }
const initialState: State = { ok: true }

const REQUIRED: { name: string; label: string }[] = [
  { name: 'scripture_ref', label: 'Scripture' },
  { name: 'scripture_text', label: 'Who is God' },
  { name: 'observation', label: 'Message' },
  { name: 'application', label: 'Reflection' },
  { name: 'prayer_points', label: 'Application' },
]

export default function MorningForm({
  today,
  entry: serverEntry,
  prompt,
  userId,
  schedule,
  onSaved,
}: {
  today: string
  entry: any
  prompt: any
  userId: string
  // The published reading plan, shown as the "QT CALENDAR" icon at the top.
  schedule?: { title: string; url: string } | null
  onSaved?: () => void
}) {
  const router = useRouter()

  // If this day was saved while offline and hasn't synced yet, show that
  // version of the answers rather than the older copy from the server.
  const [entry, setEntry] = useState<any>(serverEntry)
  const [formKey, setFormKey] = useState('server')
  useEffect(() => {
    const queued = listQueue().find((i) => i.key === `morning:${today}`)
    if (queued) {
      setEntry({ ...(serverEntry ?? {}), ...queued.payload })
      setFormKey('queued')
    } else {
      setEntry(serverEntry)
    }
  }, [serverEntry, today])

  async function handleSubmit(_prev: State, form: FormData): Promise<State> {
    const entry_date = (form.get('entry_date') as string) || today

    // Every question must be answered before the entry can be saved.
    for (const f of REQUIRED) {
      if (!((form.get(f.name) as string) || '').trim()) {
        return { ok: false, message: `Please fill in "${f.label}" before saving.` }
      }
    }

    const payload = {
      user_id: userId,
      entry_date,
      kind: 'morning' as const,
      scripture_ref: (form.get('scripture_ref') as string).trim(),
      scripture_text: (form.get('scripture_text') as string).trim(),
      observation: (form.get('observation') as string).trim(),
      application: (form.get('application') as string).trim(),
      prayer_points: (form.get('prayer_points') as string).trim(),
      visibility: entry?.visibility ?? 'private',
      is_prayer_request: entry?.is_prayer_request ?? false,
    }

    // No connection at all — don't even try the network, just queue it.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueEntry('morning', entry_date, payload)
      return { ok: true, offline: true }
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('entries')
        .upsert(payload, { onConflict: 'user_id,entry_date,kind' })
      if (error) throw error
      router.refresh()
      onSaved?.()
      return { ok: true, saved: true }
    } catch (e: any) {
      if (isNetworkError(e)) {
        queueEntry('morning', entry_date, payload)
        return { ok: true, offline: true }
      }
      return { ok: false, message: e?.message ?? 'Could not save. Try again.' }
    }
  }

  const [state, formAction] = useActionState(handleSubmit, initialState)

  return (
    <form key={formKey} action={formAction} className="space-y-5">
      <input type="hidden" name="entry_date" value={today} />

      {schedule !== undefined && (
        <div className="flex items-center justify-between">
          <QtCalendar title={schedule?.title ?? 'QT Calendar'} url={schedule?.url ?? null} />
          {!schedule && <span className="text-xs text-muted">No reading plan published yet</span>}
        </div>
      )}

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.ok && state.offline && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
          Saved on this device {'\u2014'} you're offline, so it'll sync automatically once you're back online.
        </p>
      )}
      {state.ok && state.saved && (
        <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">Saved.</p>
      )}

      <Field label="Scripture" name="scripture_ref" defaultValue={entry?.scripture_ref} placeholder="e.g. Psalm 23:1-6" />
      <Field label="Who is God" name="scripture_text" defaultValue={entry?.scripture_text} textarea rows={4} />

      <Field
        label="Message"
        hint={prompt?.body ?? 'What does this passage reveal about God\u2019s character?'}
        name="observation"
        defaultValue={entry?.observation}
        textarea
        rows={4}
      />
      <Field label="Reflection" hint="How does this shape what you do today?" name="application" defaultValue={entry?.application} textarea rows={4} />
      <Field label="Application" name="prayer_points" defaultValue={entry?.prayer_points} textarea rows={4} />

      <SaveButton />
    </form>
  )
}

function Field({
  label,
  hint,
  name,
  defaultValue,
  placeholder,
  textarea,
  rows = 3,
}: {
  label: string
  hint?: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  textarea?: boolean
  rows?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={name}>
        {label} <span className="text-red-500" aria-hidden>*</span>
      </label>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          required
          defaultValue={defaultValue ?? ''}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2"
        />
      ) : (
        <input
          id={name}
          name={name}
          required
          defaultValue={defaultValue ?? ''}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2"
        />
      )}
    </div>
  )
}
