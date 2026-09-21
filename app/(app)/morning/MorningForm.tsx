'use client'

import { useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { queueEntry, isNetworkError } from '@/lib/offlineQueue'
import EntryShareControls from '@/components/EntryShareControls'
import SaveButton from '@/components/SaveButton'

type State = { ok: true; offline?: boolean } | { ok: false; message: string }
const initialState: State = { ok: true }

export default function MorningForm({
  today,
  entry,
  prompt,
  userId,
}: {
  today: string
  entry: any
  prompt: any
  userId: string
}) {
  async function handleSubmit(_prev: State, form: FormData): Promise<State> {
    const entry_date = (form.get('entry_date') as string) || today
    const payload = {
      user_id: userId,
      entry_date,
      kind: 'morning' as const,
      scripture_ref: (form.get('scripture_ref') as string) || null,
      scripture_text: (form.get('scripture_text') as string) || null,
      observation: (form.get('observation') as string) || null,
      application: (form.get('application') as string) || null,
      prayer_points: (form.get('prayer_points') as string) || null,
      visibility: form.get('visibility') === 'shared_with_admin' ? 'shared_with_admin' : 'private',
      is_prayer_request: form.get('prayer_request') === 'on',
    }

    // No connection at all \u2014 don't even try the network, just queue it.
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
      return { ok: true }
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
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="entry_date" value={today} />

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.ok && state.offline && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
          Saved on this device {'\u2014'} you're offline, so it'll sync automatically once you're back online.
        </p>
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

      <EntryShareControls
        defaultVisibility={entry?.visibility ?? 'private'}
        defaultPrayerRequest={entry?.is_prayer_request ?? false}
      />

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
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={name}>{label}</label>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          defaultValue={defaultValue ?? ''}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2"
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue ?? ''}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2"
        />
      )}
    </div>
  )
}
