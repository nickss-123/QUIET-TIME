// app/(app)/evening/EveningForm.tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { queueEntry, isNetworkError, listQueue } from '@/lib/offlineQueue'
import SaveButton from '@/components/SaveButton'

type State = { ok: true; offline?: boolean; saved?: boolean } | { ok: false; message: string }
const initialState: State = { ok: true }

// Every question on the evening checklist must be answered before saving.
const REQUIRED: { name: string; label: string }[] = [
  { name: 'holy_spirit_conscious', label: 'Did I live today conscious of the Holy Spirit?' },
  { name: 'coram_deo', label: 'Did I live a life of Coram Deo today?' },
  { name: 'one_minute_prayer', label: 'Did I "One Minute Prayer" every moment today?' },
  { name: 'supernatural_joy_peace', label: 'Did I experience the supernatural joy and peace…?' },
  { name: 'holy_spirit_guidance_crisis', label: 'Did I seek the guidance of the Holy Spirit…?' },
  { name: 'love_endure_forgive', label: 'Did I love, endure, and forgive…?' },
  { name: 'grace_received', label: 'What grace did I receive today?' },
  { name: 'thankful_for', label: 'What am I thankful for?' },
  { name: 'repent_of', label: 'What do I need to repent of?' },
  { name: 'prayer_requests', label: 'Prayer requests?' },
]

export default function EveningForm({
  today,
  entry: serverEntry,
  prompt,
  userId,
  onSaved,
}: {
  today: string
  entry: any
  prompt: any
  userId: string
  onSaved?: () => void
}) {
  const router = useRouter()

  // If this day was saved while offline and hasn't synced yet, show that
  // version of the answers rather than the older copy from the server.
  const [entry, setEntry] = useState<any>(serverEntry)
  const [formKey, setFormKey] = useState('server')
  useEffect(() => {
    const queued = listQueue().find((i) => i.key === `evening:${today}`)
    if (queued) {
      setEntry({ ...(serverEntry ?? {}), ...queued.payload })
      setFormKey('queued')
    } else {
      setEntry(serverEntry)
    }
  }, [serverEntry, today])

  async function handleSubmit(_prev: State, form: FormData): Promise<State> {
    const entry_date = (form.get('entry_date') as string) || today

    for (const f of REQUIRED) {
      if (!((form.get(f.name) as string) || '').trim()) {
        return { ok: false, message: `Please answer "${f.label}" before saving.` }
      }
    }

    const payload = {
      user_id: userId,
      entry_date,
      kind: 'evening' as const,
      holy_spirit_conscious: (form.get('holy_spirit_conscious') as string) || null,
      coram_deo: (form.get('coram_deo') as string) || null,
      one_minute_prayer: (form.get('one_minute_prayer') as string) || null,
      supernatural_joy_peace: (form.get('supernatural_joy_peace') as string) || null,
      holy_spirit_guidance_crisis: (form.get('holy_spirit_guidance_crisis') as string) || null,
      love_endure_forgive: (form.get('love_endure_forgive') as string) || null,
      grace_received: (form.get('grace_received') as string) || null,
      thankful_for: (form.get('thankful_for') as string) || null,
      repent_of: (form.get('repent_of') as string) || null,
      prayer_requests: (form.get('prayer_requests') as string) || null,
      visibility: entry?.visibility ?? 'private',
      is_prayer_request: entry?.is_prayer_request ?? false,
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueEntry('evening', entry_date, payload)
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
        queueEntry('evening', entry_date, payload)
        return { ok: true, offline: true }
      }
      return { ok: false, message: e?.message ?? 'Could not save. Try again.' }
    }
  }

  const [state, formAction] = useActionState(handleSubmit, initialState)

  return (
    <form key={formKey} action={formAction} className="space-y-5">
      <input type="hidden" name="entry_date" value={today} />

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.ok && state.saved && (
        <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">Saved.</p>
      )}
      {state.ok && state.offline && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
          Saved on this device {'\u2014'} you're offline, so it'll sync automatically once you're back online.
        </p>
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

      <p className="text-xs text-muted">All questions are required.</p>

      <SaveButton />
    </form>
  )
}

function Field({ label, hint, name, defaultValue }: { label: string; hint?: string; name: string; defaultValue?: string | null }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={name}>
        {label} <span className="text-red-500" aria-hidden>*</span>
      </label>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      <textarea id={name} name={name} rows={3} required defaultValue={defaultValue ?? ''} className="w-full rounded-lg px-3 py-2" />
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
      <p className="mb-1 text-sm font-medium text-ink">
        {label} <span className="text-red-500" aria-hidden>*</span>
      </p>
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
