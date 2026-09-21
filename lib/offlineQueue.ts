'use client'

// A tiny local outbox for journal entries written while offline.
// Keyed by kind+date so a second offline save on the same day just replaces
// the queued one, matching the same (user_id, entry_date, kind) upsert the
// server would otherwise perform.

const QUEUE_KEY = 'qt_offline_queue_v1'
const CHANGE_EVENT = 'qt-offline-queue-changed'

export type QueuedEntry = {
  key: string
  kind: 'morning' | 'evening'
  entry_date: string
  payload: Record<string, unknown>
  queued_at: number
}

function readQueue(): QueuedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedEntry[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: QueuedEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or disabled (e.g. private browsing) \u2014 nothing more we can do.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function queueEntry(
  kind: QueuedEntry['kind'],
  entry_date: string,
  payload: Record<string, unknown>
) {
  const key = `${kind}:${entry_date}`
  const items = readQueue().filter((i) => i.key !== key)
  items.push({ key, kind, entry_date, payload, queued_at: Date.now() })
  writeQueue(items)
}

export function listQueue(): QueuedEntry[] {
  return readQueue()
}

export function removeFromQueue(key: string) {
  writeQueue(readQueue().filter((i) => i.key !== key))
}

export function onQueueChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb)
  return () => window.removeEventListener(CHANGE_EVENT, cb)
}

// Looks like a browser/network failure (fetch couldn't reach the server) as
// opposed to a real error response (bad data, RLS rejection, etc). Only the
// former should be queued for later \u2014 the latter should surface to the user.
export function isNetworkError(err: unknown): boolean {
  if (!err) return false
  const message = typeof err === 'object' && err && 'message' in err ? String((err as any).message) : String(err)
  return /fetch|network|Failed to fetch|NetworkError|internet/i.test(message)
}

// Tries to push every queued entry. Stops at the first failure (we're
// probably still offline) rather than reordering or dropping entries.
export async function flushQueue(
  upsert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
): Promise<{ synced: number; remaining: number }> {
  const items = readQueue()
  let synced = 0
  for (const item of items) {
    const { error } = await upsert(item.payload)
    if (error) break
    removeFromQueue(item.key)
    synced++
  }
  return { synced, remaining: readQueue().length }
}
