// app/(app)/evening/EveningForm.tsx
'use client'

import { useActionState } from 'react'
import { saveEveningEntry } from './actions'
import EntryShareControls from '@/components/EntryShareControls'
import SaveButton from '@/components/SaveButton'

const initialState = { ok: true as const }

export default function EveningForm({ today, entry, prompt }: { today: string; entry: any; prompt: any }) {
  const [state, formAction] = useActionState(saveEveningEntry, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="entry_date" value={today} />

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}

      <Field label="Where did you see God today?" hint={prompt?.body} name="presence_of_god" defaultValue={entry?.presence_of_god} />
      <Field label="Blessings" name="blessings" defaultValue={entry?.blessings} />
      <Field label="Growth" hint="What did today teach you about your own heart?" name="growth" defaultValue={entry?.growth} />
      <Field label="Struggles" name="struggles" defaultValue={entry?.struggles} />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">How was today, overall?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex flex-1 cursor-pointer flex-col items-center rounded-lg border border-line py-2 text-sm">
              <input type="radio" name="mood" value={n} defaultChecked={entry?.mood === n} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
      </div>

      <EntryShareControls
        defaultVisibility={entry?.visibility ?? 'private'}
        defaultPrayerRequest={entry?.is_prayer_request ?? false}
      />

      <SaveButton />
    </form>
  )
}

function Field({ label, hint, name, defaultValue }: { label: string; hint?: string; name: string; defaultValue?: string | null }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={name}>{label}</label>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      <textarea id={name} name={name} rows={3} defaultValue={defaultValue ?? ''} className="w-full rounded-lg px-3 py-2" />
    </div>
  )
}
