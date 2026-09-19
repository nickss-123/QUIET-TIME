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
        
