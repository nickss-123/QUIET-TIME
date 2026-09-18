import { createClient } from '@/lib/supabase/server'

export default async function StreakCard() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('my_streaks').single()
  if (!data) return null

  const rows = [
    {
      label: 'Morning devotion',
      current: data.morning_current,
      best: data.morning_longest,
      done: data.logged_today_morning,
      href: '/morning',
    },
    {
      label: 'Evening diary',
      current: data.evening_current,
      best: data.evening_longest,
      done: data.logged_today_evening,
      href: '/evening',
    },
  ]

  return (
    <section className="card p-4">
      <h2 className="mb-3 font-serif text-lg text-ink">Your consistency</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-line p-3">
            <p className="text-sm text-muted">{r.label}</p>
            <p className="text-3xl tabular-nums text-ink">
              {r.current}
              <span className="ml-1 text-base text-muted">
                {r.current === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="text-xs text-muted">Best: {r.best}</p>
            {r.done ? (
              <p className="mt-2 text-sm text-accent">Logged today</p>
            ) : (
              <a href={r.href} className="mt-2 inline-block text-sm text-accent underline">
                Write today&rsquo;s
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
