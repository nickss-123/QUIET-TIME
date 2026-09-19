export default function ProfileLoading() {
  return (
    <div className="max-w-xl animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-line/60" />
        <div className="h-4 w-24 rounded bg-line/40" />
      </div>

      <section className="card space-y-4 p-4">
        <div className="h-4 w-16 rounded bg-line/60" />
        <div className="h-20 w-20 rounded-full bg-line/40" />
      </section>

      <div className="card space-y-4 p-4">
        <div className="h-4 w-24 rounded bg-line/60" />
        <div className="h-11 rounded-lg bg-line/40" />
        <div className="h-11 rounded-lg bg-line/40" />
      </div>
    </div>
  )
}
