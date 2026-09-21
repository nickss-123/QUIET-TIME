'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listQueue, flushQueue, onQueueChange } from '@/lib/offlineQueue'

export default function OfflineSyncBanner() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const refresh = useCallback(() => setPending(listQueue().length), [])

  const sync = useCallback(async () => {
    if (!navigator.onLine || syncing) return
    setSyncing(true)
    try {
      const supabase = createClient()
      await flushQueue(
        (payload) =>
          supabase.from('entries').upsert(payload, { onConflict: 'user_id,entry_date,kind' }) as any
      )
    } finally {
      setSyncing(false)
      refresh()
    }
  }, [refresh, syncing])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    refresh()

    const handleOnline = () => {
      setIsOnline(true)
      sync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const unsubscribe = onQueueChange(refresh)

    if (navigator.onLine) sync()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (pending === 0 && isOnline) return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 text-sm text-ink">
      <span>
        {!isOnline
          ? "You're offline. Anything you save will be kept on this device and synced automatically once you're back online."
          : syncing
            ? 'Syncing your offline entries\u2026'
            : pending > 0
              ? `${pending} ${pending === 1 ? 'entry is' : 'entries are'} saved on this device and waiting to sync.`
              : null}
      </span>
      {isOnline && pending > 0 && !syncing && (
        <button onClick={sync} className="font-medium text-accent underline underline-offset-2">
          Sync now
        </button>
      )}
    </div>
  )
}
