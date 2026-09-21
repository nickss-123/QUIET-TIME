export default function CommunityLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-32 rounded bg-line/60" />
      <div className="card space-y-3 p-4">
        <div className="h-20 rounded-lg bg-line/30" />
        <div className="h-10 w-24 rounded-lg bg-line/40" />
      </div>
      <div className="card divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-line/40" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-line/40" />
              <div className="h-12 rounded bg-line/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
