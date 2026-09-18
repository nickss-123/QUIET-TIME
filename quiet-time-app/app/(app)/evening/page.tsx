import { createClient } from '@/lib/supabase/server'
import { saveEveningEntry } from './actions'
import EntryShareControls from '@/components/EntryShareControls'
import SaveButton from '@/components/SaveButton'

export default async function EveningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: today } = await supabase.rpc('user_today', { p_user: user!.id })

  const [{ data: entry }, { data: prompt }] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('kind', 'evening')
      .eq('entry_date', today)
      .maybeSingle(),
    supabase
      .from('prompts')
      .select('body')
      .eq('kind', 'evening')
      .eq('is_active', true)
      .order('id')
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-serif text-2xl text-ink">Evening diary</h1>
      <p className="mb-6 text-sm text-muted">{today}</p>

      <form action={saveEveningEntry} className="space-y-5">
        <input type="hidden" name="entry_date" value={today} />

        <Field
          label="Where did you see God today?"
          hint={prompt?.body}
          name="presence_of_god"
          defaultValue={entry?.presence_of_god}
        />
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
    </div>
  )
}

function Field({
  label,
  hint,
  name,
  defaultValue,
}: {
  label: string
  hint?: string
  name: string
  defaultValue?: string | null
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={name}>{label}</label>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-lg px-3 py-2"
      />
    </div>
  )
}
