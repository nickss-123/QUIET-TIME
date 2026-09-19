'use client'

import { useActionState } from 'react'
import { saveMorningEntry } from './actions'
import EntryShareControls from '@/components/EntryShareControls'
import SaveButton from '@/components/SaveButton'

const initialState = { ok: true as const }

export default function MorningForm({ today, entry, prompt }: { today: string; entry: any; prompt: any }) {
  const [state, formAction] = useActionState(saveMorningEntry, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="entry_date" value={today} />

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}

      <Field label="Scripture reference" name="scripture_ref" defaultValue={entry?.scripture_ref} placeholder="e.g. Psalm 23:1-6" />
      <Field label="Scripture" name="scripture_text" defaultValue={entry?.scripture_text} textarea rows={4} />

      <Field
        label="Observation"
        hint={prompt?.body ?? 'What does this passage reveal about God\u2019s character?'}
        name="observation"
        defaultValue={entry?.observation}
        textarea
        rows={4}
      />
      <Field label="Application" hint="How does this shape what you do today?" name="application" defaultValue={entry?.application} textarea rows={4} />
      <Field label="Prayer points" name="prayer_points" defaultValue={entry?.prayer_points} textarea rows={4} />

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
