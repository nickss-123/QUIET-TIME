import type { CSSProperties } from 'react'

export const THEME_IDS = ['dawn', 'vesper', 'cedar', 'linen', 'tide', 'ink'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const COLOR_KEYS = ['bg', 'surface', 'ink', 'muted', 'line', 'accent'] as const
export type ColorKey = (typeof COLOR_KEYS)[number]
export type Colors = Record<ColorKey, string>

export const COLOR_LABELS: Record<ColorKey, { label: string; hint: string }> = {
  bg: { label: 'Background', hint: 'The page behind everything' },
  surface: { label: 'Cards', hint: 'Cards, inputs and the header' },
  ink: { label: 'Text', hint: 'Main text and headings' },
  muted: { label: 'Secondary text', hint: 'Hints, dates and captions' },
  line: { label: 'Borders', hint: 'Dividers and outlines' },
  accent: { label: 'Accent', hint: 'Buttons, highlights and selected options' },
}

// Mirrors app/themes.css. If you change a palette there, change it here too
// (this copy is what fills the colour pickers and is used to validate saves).
export const THEME_COLORS: Record<ThemeId, Colors> = {
  dawn:   { bg: '#eef2f6', surface: '#ffffff', ink: '#1c2733', muted: '#5d6b7a', line: '#d3dce5', accent: '#b8852a' },
  vesper: { bg: '#141a2b', surface: '#1d2438', ink: '#e6e9f2', muted: '#9aa3bd', line: '#2c3450', accent: '#e0a44f' },
  cedar:  { bg: '#f2ece1', surface: '#fbf7f0', ink: '#2f2a22', muted: '#6f6455', line: '#ddd2c0', accent: '#4a6b48' },
  linen:  { bg: '#f7f6f3', surface: '#ffffff', ink: '#23262b', muted: '#6b7078', line: '#e2e0da', accent: '#2f4f8f' },
  tide:   { bg: '#e9f1f0', surface: '#ffffff', ink: '#17302f', muted: '#547471', line: '#c9dedb', accent: '#0f766e' },
  ink:    { bg: '#ffffff', surface: '#ffffff', ink: '#000000', muted: '#555555', line: '#000000', accent: '#a83232' },
}

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && (THEME_IDS as readonly string[]).includes(v)
}

/** Accepts #rrggbb, rrggbb, #rgb, rgb; returns lowercase #rrggbb or null. */
export function normalizeHex(v: unknown): string | null {
  if (typeof v !== 'string') return null
  let s = v.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toLowerCase()}` : null
}

/** The member's saved overrides (only valid hex values survive). */
export function overridesFromProfile(accent: unknown, custom: unknown): Partial<Colors> {
  const out: Partial<Colors> = {}
  const src = custom && typeof custom === 'object' ? (custom as Record<string, unknown>) : {}
  for (const key of COLOR_KEYS) {
    if (key === 'accent') continue
    const hex = normalizeHex(src[key])
    if (hex) out[key] = hex
  }
  const accentHex = normalizeHex(accent)
  if (accentHex) out.accent = accentHex
  return out
}

/** Preset colours with the member's overrides on top. */
export function resolveColors(theme: unknown, accent: unknown, custom: unknown): Colors {
  const base = THEME_COLORS[isThemeId(theme) ? theme : 'dawn']
  return { ...base, ...overridesFromProfile(accent, custom) }
}

/** Inline CSS variables for <html>; only overridden colours are emitted. */
export function overridesToStyle(overrides: Partial<Colors>): CSSProperties | undefined {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries.map(([k, v]) => [`--${k}`, v])) as CSSProperties
}
