import type { ColorKey, Colors } from '@/lib/themes'

function channel(v: number) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export type ReadabilityIssue = { level: 'error' | 'warn'; message: string }

type Check = {
  keys: ColorKey[]                  // only checked when one of these was customised
  pair: (c: Colors) => [string, string]
  what: string
  warnBelow: number
  errorBelow?: number               // hard floor; the server refuses to save below this
}

const CHECKS: Check[] = [
  { keys: ['ink', 'bg'],      pair: (c) => [c.ink, c.bg],        what: 'Text on the background', warnBelow: 4.5, errorBelow: 3 },
  { keys: ['ink', 'surface'], pair: (c) => [c.ink, c.surface],   what: 'Text on cards',          warnBelow: 4.5, errorBelow: 3 },
  { keys: ['muted', 'bg'],    pair: (c) => [c.muted, c.bg],      what: 'Secondary text',         warnBelow: 3 },
  { keys: ['accent'],         pair: (c) => ['#ffffff', c.accent], what: 'White button text on the accent colour', warnBelow: 3 },
]

/**
 * Contrast problems caused by the colours the member changed.
 * Errors block saving, so nobody can end up with text they can't read
 * (and therefore can't get back to this page to fix).
 */
export function readabilityIssues(colors: Colors, changed: ColorKey[]): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = []
  for (const check of CHECKS) {
    if (!check.keys.some((k) => changed.includes(k))) continue
    const [a, b] = check.pair(colors)
    const ratio = contrastRatio(a, b)
    const shown = `${ratio.toFixed(1)}:1`
    if (check.errorBelow !== undefined && ratio < check.errorBelow) {
      issues.push({ level: 'error', message: `${check.what} would be too hard to read (contrast ${shown}, needs at least ${check.errorBelow}:1).` })
    } else if (ratio < check.warnBelow) {
      issues.push({ level: 'warn', message: `${check.what} may be hard to read (contrast ${shown}; ${check.warnBelow}:1 or more is comfortable).` })
    }
  }
  return issues
}
