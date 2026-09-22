'use client'

import { useEffect } from 'react'

// next/link normally moves between pages with a client-side RSC fetch, and
// the service worker only ever gets a copy of that RSC payload for a route
// after the member has actually transitioned to it once while online. The
// full HTML document for every tab, on the other hand, is proactively
// warmed by WARM_CACHE on every visit (see RegisterServiceWorker + sw.js).
//
// So while offline, tapping a tab whose RSC transition was never warmed
// leaves the content area blank (the fetch fails and the router just gives
// up). To avoid that, this listens for clicks on same-origin links while
// offline and does a full navigation instead, which the worker can always
// serve from its per-route page cache.
export function OfflineLinkGuard() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navigator.onLine) return
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      e.preventDefault()
      window.location.assign(url.pathname + url.search + url.hash)
    }

    // Capture phase so this runs before next/link's own click handler.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
