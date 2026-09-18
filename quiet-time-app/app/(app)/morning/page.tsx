import { createClient } from '@/lib/supabase/server'
import { saveMorningEntry } from './actions'
import EntryShareControls from '@/components/EntryShareControls'
import SaveButton from '@/components/SaveButton'

export default async function MorningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: today } = await supabase.rpc('user_today', { p_user: user!.id })

  const [{ data: entry }, { data: prompt }] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('kind', 'morning')
      .eq('entry_date', today)
      .maybeSingle(),
    supabase
      .from('prompts')
      .select('body')
      .eq('kind', 'morning')
      .eq('is_active', true)
      .order('id')
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-serif text-2xl text-ink">Morning devotion</h1>
      <p className="mb-6 text-sm text-muted">{today}</p>

      <form action={saveMorningEntry} className="space-y-5">
        <input type="hidden" name="entry_date" value={today} />

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
    </div>
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
