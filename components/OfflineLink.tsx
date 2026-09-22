'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'

// Same as next/link, except: when there's no connection, a normal Link does
// a lightweight in-app data fetch (RSC) to swap in the new page's content --
// and that fetch is more fragile offline than the service worker's full-page
// cache. So offline, force a real page load instead; the service worker's
// handleNavigate already reliably serves the last cached copy of that page
// (warmed by WARM_CACHE), where a plain Link would just show a blank page.
export default function OfflineLink({
  href,
  onClick,
  ...rest
}: ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (typeof navigator !== 'undefined' && !navigator.onLine && !e.defaultPrevented) {
          e.preventDefault()
          window.location.href = href.toString()
        }
      }}
      {...rest}
    />
  )
}
