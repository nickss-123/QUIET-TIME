export default function RankingsLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="h-7 w-28 rounded bg-line/60" />
        <div className="flex gap-1">
          <div className="h-7 w-16 rounded-full bg-line/40" />
          <div className="h-7 w-16 rounded-full bg-line/40" />
          <div className="h-7 w-16 rounded-full bg-line/40" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-28 rounded-lg bg-line/40" />
        <div className="h-8 w-24 rounded-lg bg-line/40" />
      </div>

      <div className="card h-16 p-4" />

      <ol className="card divide-y divide-line">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-3">
            <div className="h-4 w-6 rounded bg-line/40" />
            <div className="h-9 w-9 rounded-full bg-line/40" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-line/40" />
              <div className="h-3 w-20 rounded bg-line/30" />
            </div>
            <div className="space-y-1 text-right">
              <div className="ml-auto h-4 w-6 rounded bg-line/40" />
              <div className="ml-auto h-3 w-14 rounded bg-line/30" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
