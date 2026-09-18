'use client'

export default function EntryShareControls({
  defaultVisibility,
  defaultPrayerRequest,
}: {
  defaultVisibility: 'private' | 'shared_with_admin'
  defaultPrayerRequest: boolean
}) {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-bg p-3 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="visibility"
          value="shared_with_admin"
          defaultChecked={defaultVisibility === 'shared_with_admin'}
        />
        Share this entry with your admin
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="prayer_request" defaultChecked={defaultPrayerRequest} />
        Flag as a prayer request
      </label>
      <p className="text-xs text-muted">
        Left unchecked, only you can read this entry. The prayer flag shares just
        this entry, even if sharing is off.
      </p>
    </div>
  )
}
