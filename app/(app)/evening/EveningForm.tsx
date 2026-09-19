
// app/(app)/evening/EveningForm.tsx
'use client'

import { useActionState, useState } from 'react'
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

      <h2 className="font-serif text-xl text-ink">Spiritual Journal Movement Checklist</h2>

      <Choice
        label="Did I live today conscious of the Holy Spirit?"
        name="holy_spirit_conscious"
        options={['Always', 'Sometimes', 'Forgot']}
        defaultValue={entry?.holy_spirit_conscious}
      />
      <Choice
        label="Did I live a life of Coram Deo today?"
        name="coram_deo"
        options={['Yes', 'Sometimes', 'No']}
        defaultValue={entry?.coram_deo}
      />
      <Choice
        label='Did I "One Minute Prayer" every moment today?'
        name="one_minute_prayer"
        options={['Always', 'Sometimes', 'No']}
        defaultValue={entry?.one_minute_prayer}
      />
      <Choice
        label="Did I experience the supernatural joy and peace given by God when praying amidst anxiety today?"
        name="supernatural_joy_peace"
        options={['Yes', 'Sometimes', 'No']}
        defaultValue={entry?.supernatural_joy_peace}
      />

      <Field
        label="Did I seek the guidance of the Holy Spirit immediately during a crisis situation?"
        hint="e.g."
        name="holy_spirit_guidance_crisis"
        defaultValue={entry?.holy_spirit_guidance_crisis}
      />
      <Field
        label="Did I love, endure, and forgive for the sake of Jesus today?"
        hint="e.g."
        name="love_endure_forgive"
        defaultValue={entry?.love_endure_forgive}
      />
      <Field
        label="What grace did I receive today?"
        hint="e.g. from God, from others..."
        name="grace_received"
        defaultValue={entry?.grace_received}
      />
      <Field
        label="What am I thankful for?"
        hint="e.g. to God, to others..."
        name="thankful_for"
        defaultValue={entry?.thankful_for}
      />
      <Field
        label="What do I need to repent of?"
        name="repent_of"
        defaultValue={entry?.repent_of}
      />
      <Field
        label="Prayer requests?"
        name="prayer_requests"
        defaultValue={entry?.prayer_requests}
      />

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

function Choice({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: string[]
  defaultValue?: string | null
}) {
  // The selection lives in state and is submitted through a hidden input, so the
  // chosen option is always visibly highlighted and always what gets saved.
  const [value, setValue] = useState(defaultValue ?? '')

  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1 text-sm font-medium text-ink">{label}</p>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2">
        {options.map((opt) => {
          const selected = value === opt
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setValue(opt)}
              className={
                'min-h-[44px] flex-1 rounded-lg border py-2 text-sm transition-colors ' +
                (selected
                  ? 'border-accent bg-accent font-medium text-white'
                  : 'border-line bg-surface text-ink hover:bg-bg')
              }
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
