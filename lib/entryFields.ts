import type { Entry, EntryKind } from '@/lib/types'

export type FieldDef = { key: keyof Entry; label: string }

// Labels match what the member saw on the form when they wrote the entry
// (see MorningForm.tsx / EveningForm.tsx). If a form label changes, change it here too.
export const ENTRY_FIELDS: Record<EntryKind, FieldDef[]> = {
  morning: [
    { key: 'scripture_ref', label: 'Scripture' },
    { key: 'scripture_text', label: 'Who is God' },
    { key: 'observation', label: 'Message' },
    { key: 'application', label: 'Reflection' },
    { key: 'prayer_points', label: 'Application' },
  ],
  evening: [
    { key: 'holy_spirit_conscious', label: 'Did I live today conscious of the Holy Spirit?' },
    { key: 'coram_deo', label: 'Did I live a life of Coram Deo today?' },
    { key: 'one_minute_prayer', label: 'Did I "One Minute Prayer" every moment today?' },
    {
      key: 'supernatural_joy_peace',
      label: 'Did I experience the supernatural joy and peace given by God when praying amidst anxiety today?',
    },
    {
      key: 'holy_spirit_guidance_crisis',
      label: 'Did I seek the guidance of the Holy Spirit immediately during a crisis situation?',
    },
    { key: 'love_endure_forgive', label: 'Did I love, endure, and forgive for the sake of Jesus today?' },
    { key: 'grace_received', label: 'What grace did I receive today?' },
    { key: 'thankful_for', label: 'What am I thankful for?' },
    { key: 'repent_of', label: 'What do I need to repent of?' },
    { key: 'prayer_requests', label: 'Prayer requests?' },
  ],
}

// Columns from earlier versions of the forms. Kept so older entries stay fully readable.
export const LEGACY_FIELDS: FieldDef[] = [
  { key: 'presence_of_god', label: 'Presence of God' },
  { key: 'blessings', label: 'Blessings' },
  { key: 'growth', label: 'Growth' },
  { key: 'struggles', label: 'Struggles' },
]

const PREVIEW_KEYS: Record<EntryKind, (keyof Entry)[]> = {
  morning: ['scripture_ref', 'observation', 'scripture_text', 'application', 'prayer_points'],
  evening: ['grace_received', 'thankful_for', 'repent_of', 'prayer_requests', 'presence_of_god', 'blessings'],
}

export function previewOf(entry: Entry, max = 80): string {
  for (const key of PREVIEW_KEYS[entry.kind]) {
    const v = entry[key]
    if (typeof v === 'string' && v.trim()) {
      const t = v.trim().replace(/\s+/g, ' ')
      return t.length > max ? `${t.slice(0, max)}\u2026` : t
    }
  }
  return ''
}
