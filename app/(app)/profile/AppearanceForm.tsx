'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { updateAppearance } from './actions'
import SaveButton from '@/components/SaveButton'
import {
  COLOR_KEYS,
  COLOR_LABELS,
  THEME_COLORS,
  isThemeId,
  normalizeHex,
  overridesFromProfile,
  resolveColors,
  type ColorKey,
  type Colors,
  type ThemeId,
} from '@/lib/themes'
import { readabilityIssues } from '@/lib/contrast'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'vesper', label: 'Vesper' },
  { id: 'cedar', label: 'Cedar' },
  { id: 'linen', label: 'Linen' },
  { id: 'tide', label: 'Tide' },
  { id: 'ink', label: 'Ink' },
]

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' },
]

const initialState = { ok: true as const }

function applyToPage(theme: ThemeId, overrides: Partial<Colors>) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  for (const key of COLOR_KEYS) {
    const value = overrides[key]
    if (value) root.style.setProperty(`--${key}`, value)
    else root.style.removeProperty(`--${key}`)
  }
}

export default function AppearanceForm({ profile }: { profile: any }) {
  const [state, formAction] = useActionState(updateAppearance, initialState)

  const savedTheme: ThemeId = isThemeId(profile.theme) ? profile.theme : 'dawn'
  const savedOverrides = overridesFromProfile(profile.accent_color, profile.custom_colors)

  const [theme, setTheme] = useState<ThemeId>(savedTheme)
  const [colors, setColors] = useState<Colors>(() =>
    resolveColors(savedTheme, profile.accent_color, profile.custom_colors)
  )
  const [selectedLocale, setSelectedLocale] = useState<string>(profile.locale ?? 'en')

  // What differs from the chosen preset is what gets saved as "custom".
  const preset = THEME_COLORS[theme]
  const changed = COLOR_KEYS.filter((k) => colors[k].toLowerCase() !== preset[k].toLowerCase())
  const issues = readabilityIssues(colors, changed)
  const hasBlockingIssue = issues.some((i) => i.level === 'error')

  // Live preview on the whole page while editing.
  useEffect(() => {
    const overrides: Partial<Colors> = {}
    for (const k of COLOR_KEYS) {
      if (colors[k].toLowerCase() !== THEME_COLORS[theme][k].toLowerCase()) overrides[k] = colors[k]
    }
    applyToPage(theme, overrides)
  }, [theme, colors])

  // Leaving the page without saving puts the saved look back.
  const saved = useRef({ theme: savedTheme, overrides: savedOverrides })
  saved.current = { theme: savedTheme, overrides: savedOverrides }
  useEffect(() => () => applyToPage(saved.current.theme, saved.current.overrides), [])

  function pickTheme(id: ThemeId) {
    setTheme(id)
    setColors(THEME_COLORS[id]) // a new preset starts from its own colours
  }

  function setColor(key: ColorKey, value: string) {
    setColors((c) => ({ ...c, [key]: value }))
  }

  return (
    <form action={formAction} className="card space-y-5 p-4">
      <h2 className="text-sm font-medium text-ink">Appearance</h2>

      {!state.ok && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.ok && 'saved' in state && (
        <p className="rounded-lg border border-line bg-bg p-2 text-sm text-ink">Saved.</p>
      )}

      <div>
        <p className="mb-2 text-sm text-muted">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <label
              key={t.id}
              data-theme={t.id}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                theme === t.id
                  ? 'border-accent ring-2 ring-accent ring-offset-1'
                  : 'border-line'
              } bg-bg`}
            >
              <input
                type="radio"
                name="theme"
                value={t.id}
                checked={theme === t.id}
                onChange={() => pickTheme(t.id)}
                className="sr-only"
              />
              <span className="size-6 rounded-full bg-accent" />
              <span className="text-xs text-ink">{t.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Preview updates immediately. Choosing a theme starts you from its colours.
          Click Save below to keep your choices.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-muted">Colours</p>
          {changed.length > 0 && (
            <button
              type="button"
              onClick={() => setColors(THEME_COLORS[theme])}
              className="text-xs text-muted underline hover:text-ink"
            >
              Reset to {THEMES.find((t) => t.id === theme)?.label} colours
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {COLOR_KEYS.map((key) => (
            <ColorRow
              key={key}
              label={COLOR_LABELS[key].label}
              hint={COLOR_LABELS[key].hint}
              value={colors[key]}
              custom={changed.includes(key)}
              onChange={(v) => setColor(key, v)}
            />
          ))}
        </div>

        {/* Only colours that differ from the theme are submitted. */}
        {COLOR_KEYS.map((key) => (
          <input
            key={key}
            type="hidden"
            name={`color_${key}`}
            value={changed.includes(key) ? colors[key] : ''}
          />
        ))}

        {issues.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs">
            {issues.map((i) => (
              <li key={i.message} className={i.level === 'error' ? 'text-red-600' : 'text-muted'}>
                {i.level === 'error' ? 'Can\u2019t save: ' : 'Heads up: '}
                {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">Language</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <label
              key={l.id}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                selectedLocale === l.id
                  ? 'border-accent ring-2 ring-accent ring-offset-1'
                  : 'border-line'
              } bg-bg`}
            >
              <input
                type="radio"
                name="locale"
                value={l.id}
                checked={selectedLocale === l.id}
                onChange={() => setSelectedLocale(l.id)}
                className="sr-only"
              />
              <span className="text-sm text-ink">{l.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Takes effect after you save.
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

      <SaveButton disabled={hasBlockingIssue} label="Save appearance" />
    </form>
  )
}

function ColorRow({
  label,
  hint,
  value,
  custom,
  onChange,
}: {
  label: string
  hint: string
  value: string
  custom: boolean
  onChange: (hex: string) => void
}) {
  // The text box keeps whatever is being typed; it only commits once it's a valid colour.
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{label}</p>
        {custom && <span className="text-xs text-muted">Custom</span>}
      </div>
      <p className="mb-2 text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour`}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-11 w-14 shrink-0 cursor-pointer p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value)
            const hex = normalizeHex(e.target.value)
            if (hex) onChange(hex)
          }}
          onBlur={() => setDraft(value)}
          className="w-full min-w-0 rounded-lg px-3 py-2 font-mono text-sm"
        />
      </div>
    </div>
  )
}
