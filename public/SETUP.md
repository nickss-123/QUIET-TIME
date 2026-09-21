# Making Quiet Time an installable app (PWA)

This turns your existing Vercel deployment into something people can install
straight from their phone's browser — a home-screen icon, its own window (no
browser bar), works like a real app. No app store, no review process, works
immediately after you deploy.

## 1. Copy files into your project

From this zip, copy into your **quiet-time-app** project (same repo as your
`app/` folder):

```
public/manifest.json          ← from manifest.json in this zip
public/sw.js                  ← from sw.js in this zip
public/offline.html           ← from offline.html in this zip
public/icons/icon-192.png     ← from icons/icon-192.png
public/icons/icon-512.png     ← from icons/icon-512.png
public/icons/apple-touch-icon.png
public/icons/favicon-32.png
components/RegisterServiceWorker.tsx   ← from RegisterServiceWorker.tsx
```

If your project doesn't already have a `public/` folder at the root (next to
`app/` and `package.json`), create one — that's where Next.js serves static
files from directly (e.g. `public/sw.js` becomes `/sw.js`).

## 2. Update `app/layout.tsx`

Add the manifest, theme color, and icons to your `metadata` export, and drop
`<RegisterServiceWorker />` into the body:

```tsx
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Quiet Time",
  description: "Sign in and log your morning journal entries.",
  manifest: "/manifest.json",
  themeColor: "#f5b261",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quiet Time",
  },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
```

(Keep whatever else is already in your layout — just merge these fields in
rather than replacing the whole file.)

## 3. Push and deploy

```bash
git add .
git commit -m "Add PWA support (installable app)"
git push
```

Vercel redeploys automatically. PWAs require HTTPS, which Vercel already
gives you by default — nothing else to configure there.

## 4. Install it

- **Android (Chrome):** open the site → a banner or the "⋮" menu shows
  "Install app" / "Add to Home Screen".
- **iPhone (Safari):** open the site → tap the Share icon → "Add to Home
  Screen". (iOS doesn't show an automatic install prompt — this is the only
  way on iPhone, and it's expected, not a bug.)
- **Desktop (Chrome/Edge):** an install icon appears in the address bar.

Once installed, it opens in its own window with the icon and name you set
here — no visible browser chrome.

## Notes

- The icon is a placeholder (a simple sunrise, matching your app's "dawn"
  theme) — swap `public/icons/*.png` for your own artwork whenever you have
  one, keeping the same filenames and sizes.
- The service worker here is intentionally minimal: it only caches an offline
  fallback page. It does **not** cache your actual app pages or API calls, so
  login/journal data is always fetched fresh from Supabase — offline support
  is just "don't show a browser error, show a friendly message" for now.
- `start_url` in `manifest.json` is set to `/login`. Change it if you'd
  rather the installed app open somewhere else by default.
