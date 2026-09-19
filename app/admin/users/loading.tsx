export default function AdminUsersLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="h-7 w-32 rounded bg-line/60" />
        <div className="h-9 w-28 rounded-lg bg-line/40" />
      </div>

      <section className="card divide-y divide-line">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-line/40" />
              <div className="h-3 w-24 rounded bg-line/30" />
            </div>
            <div className="h-6 w-16 rounded-full bg-line/30" />
          </div>
        ))}
      </section>
    </div>
  )
}
