
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScheduleUploadForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    setBusy(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/schedule', { method: 'POST', body: data })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage({ type: 'error', text: json.error ?? 'Upload failed. Check the details and try again.' })
      } else {
        setMessage({ type: 'ok', text: 'Schedule published.' })
        form.reset()
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server. Check your connection and try again.' })
    } finally {
      setBusy(false)
    }
  }

  const inputClass = 'w-full rounded border border-line bg-transparent p-2 text-ink'

  return (
    <section className="card p-4">
      <h2 className="mb-4 font-serif text-lg text-ink">Upload a new schedule</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-ink">
          Title
          <input name="title" type="text" required className={inputClass} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-ink">
            Starts on
            <input name="starts_on" type="date" required className={inputClass} />
          </label>
          <label className="block text-sm text-ink">
            Ends on
            <input name="ends_on" type="date" required className={inputClass} />
          </label>
        </div>

        <label className="block text-sm text-ink">
          Schedule image
          <input name="image" type="file" accept="image/*" required className={inputClass} />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Uploading...' : 'Publish schedule'}
        </button>

        {message && (
          <p role="status" className={message.type === 'ok' ? 'text-sm text-accent' : 'text-sm text-red-600'}>
            {message.text}
          </p>
        )}
      </form>
    </section>
  )
}
