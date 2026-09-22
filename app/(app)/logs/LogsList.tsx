'use client'

import { useEffect, useState } from 'react'
import OfflineLink from '@/components/OfflineLink'
import { previewOf } from '@/lib/entryFields'
import type { Entry } from '@/lib/types'
import { SunIcon, MoonIcon } from '@/components/NavIcons'
import { listQueue } from '@/lib/offlineQueue'

type DayRow = { morning?: Entry; evening?: Entry }

function prettyDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Same list the server rendered, plus anything saved on this device while
// offline that hasn't synced yet -- so a just-saved entry shows up here
// immediately, even with no connection, instead of only appearing after
// the next successful sync.
export default function LogsList({
  page,
  initialDates,
  initialByDate,
  pendingDates,
}: {
  page: number
  initialDates: string[]
  initialByDate: Record<string, DayRow>
  pendingDates: string[]
}) {
  const [dates, setDates] = useState(initialDates)
  const [byDate, setByDate] = useState(initialByDate)
  const pendingSet = new Set(pendingDates)

  useEffect(() => {
    const queued = listQueue()
    if (queued.length === 0) return

    // Only page 1 is "newest first", which is where a freshly-queued entry
    // (almost always today, occasionally yesterday) belongs.
    if (page !== 1) return

    setByDate((prev) => {
      const next = { ...prev }
      for (const item of queued) {
        const existing = next[item.entry_date] ?? {}
        // Merge over the synced copy if there is one -- the queued version
        // is the newer, not-yet-synced edit.
        const base = existing[item.kind] ?? ({ entry_date: item.entry_date, kind: item.kind } as Entry)
        next[item.entry_date] = { ...existing, [item.kind]: { ...base, ...item.payload } as Entry }
      }
      return next
    })

    setDates((prev) => {
      const queuedDates = queued.map((q) => q.entry_date)
      const merged = new Set([...prev, ...queuedDates])
      return [...merged].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    })
    // Queue is read once on mount -- OfflineSyncBanner triggers a full
    // refresh after a real sync, which re-runs this from fresh server data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <section className="card divide-y divide-line">
      {dates.length === 0 && (
        <p className="p-4 text-muted">
          {page > 1 ? 'No entries on this page.' : 'Nothing logged yet. Your first entry will show up here.'}
        </p>
      )}
      {dates.map((date) => {
        const day = byDate[date] ?? {}
        const preview = day.morning ? previewOf(day.morning) : day.evening ? previewOf(day.evening) : ''
        return (
          <OfflineLink
            key={date}
            href={`/logs/${date}`}
            className="flex items-center justify-between gap-3 p-3 hover:bg-bg"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{prettyDate(date)}</p>
              <p className="truncate text-xs text-muted">{preview || 'Open to read'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
              {pendingSet.has(date) && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Delete requested</span>
              )}
              <span title="Morning" className={day.morning ? 'text-accent' : 'opacity-25'}>
                <SunIcon className="h-5 w-5" />
              </span>
              <span title="Evening" className={day.evening ? 'text-accent' : 'opacity-25'}>
                <MoonIcon className="h-5 w-5" />
              </span>
            </div>
          </OfflineLink>
        )
      })}
    </section>
  )
}
