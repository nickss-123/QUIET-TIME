'use client'

import { useEffect } from 'react'

const UPDATE_CHECK_MS = 60_000

// Registers the offline worker and keeps it fresh:
//  - checks for a new build on load, whenever the app comes back to the
//    foreground, and once a minute while open;
//  - when a new worker takes over (controllerchange) the page reloads once,
//    so members always run the latest deploy without reinstalling;
//  - after registration it asks the worker to pre-cache the main screens.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reloaded = false
    const onControllerChange = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    let timer: number | undefined
    let registration: ServiceWorkerRegistration | undefined

    const check = () => {
      if (navigator.onLine) registration?.update().catch(() => {})
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        registration = reg
        // A worker already waiting means a newer build was downloaded earlier.
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
        const warm = () => (reg.active ?? navigator.serviceWorker.controller)?.postMessage({ type: 'WARM_CACHE' })
        if (reg.active) warm()
        else navigator.serviceWorker.ready.then(warm)

        timer = window.setInterval(check, UPDATE_CHECK_MS)
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('online', check)
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err)
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', check)
      if (timer) window.clearInterval(timer)
    }
  }, [])

  return null
}
