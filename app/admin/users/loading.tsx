export default function AdminUsersLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <section className="card space-y-3 p-4">
        <div className="h-5 w-32 rounded bg-line/40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-11 rounded-lg bg-line/30" />
          <div className="h-11 rounded-lg bg-line/30" />
          <div className="h-11 rounded-lg bg-line/30 sm:col-span-2" />
          <div className="h-10 rounded-lg bg-line/40 sm:col-span-2" />
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div className="h-5 w-20 rounded bg-line/40" />
        <div className="flex gap-2">
          <div className="h-11 flex-1 rounded-lg bg-line/30" />
          <div className="h-11 w-24 rounded-lg bg-line/40" />
        </div>
      </section>

      <section className="card divide-y divide-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-line/40" />
              <div className="h-3 w-40 rounded bg-line/30" />
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-24 rounded bg-line/30" />
              <div className="h-4 w-20 rounded bg-line/30" />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
