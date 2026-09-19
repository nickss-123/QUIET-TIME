'use client'

import { useActionState, useState } from 'react'
import { updateAppearance } from './actions'
import SaveButton from '@/components/SaveButton'

const THEMES: { id: string; label: string }[] = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'vesper', label: 'Vesper' },
  { id: 'cedar', label: 'Cedar' },
  { id: 'linen', label: 'Linen' },
  { id: 'tide', label: 'Tide' },
  { id: 'ink', label: 'Ink' },
]

const initialState = { ok: true as const }

export default function AppearanceForm({ profile }: { profile: any }) {
  const [state, formAction] = useActionState(updateAppearance, initialState)
  const [selectedTheme, setSelectedTheme] = useState<string>(profile.theme ?? 'dawn')

  function previewTheme(themeId: string) {
    setSelectedTheme(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
  }

  return (
    <form action={formAction} className="card space-y-5 p-4">
      <h2 className="text-sm font-medium text-ink">Appearance</h2>

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}

      <div>
        <p className="mb-2 text-sm text-muted">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <label
              key={t.id}
              data-theme={t.id}
              onClick={() => previewTheme(t.id)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                selectedTheme === t.id
                  ? 'border-accent ring-2 ring-accent ring-offset-1'
                  : 'border-line'
              } bg-bg`}
            >
              <input
                type="radio"
                name="theme"
                value={t.id}
                checked={selectedTheme === t.id}
                onChange={() => previewTheme(t.id)}
                className="sr-only"
              />
              <span className="size-6 rounded-full bg-accent" />
              <span className="text-xs text-ink">{t.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Preview updates immediately. Click Save below to keep it.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="accent_color">
          Custom accent colour (optional)
        </label>
        <input
          id="accent_color"
          name="accent_color"
          defaultValue={profile.accent_color ?? ''}
          placeholder="#0f766e"
          className="w-40 rounded-lg px-3 py-2"
        />
        <p className="mt-1 text-xs text-muted">
          Overrides just the accent colour of your chosen theme. Leave blank to use the theme&rsquo;s default.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          maxLength={280}
          defaultValue={profile.bio ?? ''}
          className="w-full rounded-lg px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="show_on_leaderboard" defaultChecked={profile.show_on_leaderboard} />
        Show me on the rankings
      </label>
      <p className="text-xs text-muted">
        Off means only you see your own row. Nobody is told when you turn this off.
      </p>

      <SaveButton />
    </form>
  )
}
