const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL

export default function Avatar({
  path,
  size = 36,
}: {
  path: string | null
  size?: number
}) {
  if (!path) {
    return (
      <div
        className="shrink-0 rounded-full border border-line bg-bg"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/storage/v1/object/public/avatars/${path}`}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}
