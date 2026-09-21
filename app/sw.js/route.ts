// The service worker is served from a route (not /public) so its VERSION
// changes on every deploy. Browsers re-check this file, see a byte change,
// install the new worker, drop the old caches, and the open app reloads
// itself — members get the update without re-installing anything.

export const dynamic = 'force-static'

const VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  String(Date.now()) // evaluated once at build time

const SW = `
const VERSION = ${JSON.stringify(VERSION)};
const PAGE_CACHE = 'qt-pages-' + VERSION;
const ASSET_CACHE = 'qt-assets-' + VERSION;
const MEDIA_CACHE = 'qt-media-v1';
const OFFLINE_URL = '/offline.html';
const APP_ROUTES = ['/morning', '/evening', '/community', '/rankings', '/profile', '/logs', '/dashboard'];
const NETWORK_TIMEOUT_MS = 8000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/manifest.json']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== PAGE_CACHE && k !== ASSET_CACHE && k !== MEDIA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  // After sign-in the app asks us to pre-cache the main screens so they
  // open even if the member later loses connection.
  if (data.type === 'WARM_CACHE') {
    event.waitUntil(
      caches.open(PAGE_CACHE).then((cache) =>
        Promise.all(
          APP_ROUTES.map((path) =>
            fetch(path, { credentials: 'same-origin', headers: { 'X-QT-Warm': '1' } })
              .then((res) => { if (res.ok && !res.redirected) return cache.put(pageKey(path), res.clone()); })
              .catch(() => {})
          )
        )
      )
    );
  }
});

function pageKey(pathname) { return new Request(pathname, { method: 'GET' }); }
function rscKey(pathname) { return new Request(pathname + '?__qt_rsc=1', { method: 'GET' }); }

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1. Full page loads: network first, fall back to the last copy of that
  //    page, then to any cached app page, then to the offline screen.
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate(req, url));
    return;
  }

  if (sameOrigin) {
    // Never cache the worker itself or the health endpoint.
    if (url.pathname === '/sw.js' || url.pathname.startsWith('/api/')) return;

    // 2. Next.js client-side navigations (RSC payloads): network first,
    //    served from cache when offline so in-app navigation keeps working.
    if (req.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
      event.respondWith(handleRsc(req, url));
      return;
    }

    // 3. Hashed build assets are immutable: cache first.
    if (url.pathname.startsWith('/_next/static/')) {
      event.respondWith(cacheFirst(req, ASSET_CACHE));
      return;
    }

    // 4. Icons, manifest, fonts, images: stale-while-revalidate.
    if (/\\.(?:png|jpg|jpeg|webp|gif|svg|ico|woff2?|json|css|js)$/.test(url.pathname) || url.pathname.startsWith('/_next/image')) {
      event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
      return;
    }
    return;
  }

  // 5. Supabase public storage (schedule image, avatars, chat photos):
  //    stale-while-revalidate so they still show offline. Auth/REST calls
  //    go straight to the network and are never cached.
  if (url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
    event.respondWith(staleWhileRevalidate(req, MEDIA_CACHE));
  }
});

async function handleNavigate(req, url) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok && !res.redirected && res.type === 'basic') {
      cache.put(pageKey(url.pathname), res.clone());
    }
    return res;
  } catch (e) {
    const cached = await cache.match(pageKey(url.pathname));
    if (cached) return cached;
    for (const path of APP_ROUTES) {
      const any = await cache.match(pageKey(path));
      if (any) return any;
    }
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function handleRsc(req, url) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok && res.type === 'basic') cache.put(rscKey(url.pathname), res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(rscKey(url.pathname));
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) return cached;
  const res = await network;
  return res || new Response('', { status: 504 });
}
`

export async function GET() {
  return new Response(SW, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  })
}
