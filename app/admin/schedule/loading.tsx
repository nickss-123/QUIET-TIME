export default function AdminScheduleLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="card space-y-3 p-4">
        <div className="h-4 w-32 rounded bg-line/40" />
        <div className="h-24 rounded-lg bg-line/30" />
        <div className="h-9 w-28 rounded-lg bg-line/40" />
      </div>

      <section className="card divide-y divide-line">
        <div className="border-b border-line p-4">
          <div className="h-5 w-36 rounded bg-line/40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-line/40" />
              <div className="h-3 w-40 rounded bg-line/30" />
            </div>
            <div className="h-3 w-10 rounded bg-line/30" />
          </div>
        ))}
      </section>
    </div>
  )
}
