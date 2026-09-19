export default function LogsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-32 rounded bg-line/60" />

      <section className="card p-4">
        <div className="mb-3 h-4 w-28 rounded bg-line/60" />
        <div className="grid grid-cols-10 gap-1 sm:grid-cols-12">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-line/40" />
          ))}
        </div>
      </section>

      <section className="card divide-y divide-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-line/40" />
              <div className="h-3 w-24 rounded bg-line/30" />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
