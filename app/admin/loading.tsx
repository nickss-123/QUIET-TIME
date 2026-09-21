export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card space-y-2 p-4">
          <div className="h-4 w-20 rounded bg-line/40" />
          <div className="h-9 w-12 rounded bg-line/40" />
        </div>
        <div className="card space-y-2 p-4">
          <div className="h-4 w-24 rounded bg-line/40" />
          <div className="h-9 w-12 rounded bg-line/40" />
        </div>
        <div className="card space-y-2 p-4">
          <div className="h-4 w-32 rounded bg-line/40" />
          <div className="h-9 w-12 rounded bg-line/40" />
        </div>
      </div>

      <section className="card">
        <div className="border-b border-line p-4">
          <div className="h-5 w-40 rounded bg-line/40" />
        </div>
        <ul className="divide-y divide-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex justify-between p-4">
              <div className="h-4 w-40 rounded bg-line/40" />
              <div className="h-4 w-28 rounded bg-line/30" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
