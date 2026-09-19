# Quiet Time — Spiritual Journal & Devotion System

A daily-devotional and journaling app for a church: admin-managed accounts,
private morning/evening entries with opt-in sharing, a consecutive-day
streak tracker, a member leaderboard, per-member themes and photos, and an
admin panel for accounts, an annual reading schedule image, and engagement.

## Stack

Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind.
Deploys to Vercel.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_rankings_themes_avatars.sql`, in that order.
3. In Project Settings \u2192 API, copy the Project URL, `anon` public key, and sb_publishable_rJBE7rtJfCxM9jRiwcYExQ_aYI-csor sb_secret_tDZ0D-GME0kVc_xgx_1f-g_H-nA0bRU
   `service_role` secret key.
4. Create your own admin account:
   - Authentication \u2192 Users \u2192 Add user. Use any email (it won't be used
     for login \u2014 members sign in with a username, see below) and a password
     you'll remember.
   - In the SQL editor:
     ```sql
     update public.profiles
     set role = 'admin', must_change_password = false, username = 'yourname'
     where id = '<the auth user id from step above>';
     ```

## 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in the three Supabase values from step 1.3.

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/login`. Members log in with a **username**,
not an email \u2014 the app maps `username` to `username@members.local`
internally (see `lib/username.ts`); nobody ever sees or uses that address.

## 3. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: New Project \u2192 import the repo.
3. Add the same three environment variables from `.env.local` under
   Project Settings \u2192 Environment Variables. **Never** expose
   `SUPABASE_SERVICE_ROLE_KEY` with the `NEXT_PUBLIC_` prefix \u2014 it must stay
   server-only.
4. Deploy. Vercel builds Next.js automatically; no other config is needed.
5. In Supabase \u2192 Authentication \u2192 URL Configuration, add your Vercel
   domain to the allowed redirect URLs (not strictly required for this
   password-based flow, but do it before you add any OAuth or magic-link
   login later).

## What's where

- `supabase/migrations/` \u2014 the full schema: tables, RLS policies, storage
  buckets, and the SQL functions the app calls (`current_streak`,
  `leaderboard`, `admin_engagement`, etc).
- `middleware.ts` \u2014 route guarding: signed-out \u2192 `/login`, forced
  password change on first login, `/admin/*` restricted to admins.
- `app/(app)/` \u2014 the member-facing pages: dashboard, morning, evening,
  logs, rankings, profile.
- `app/admin/` \u2014 the admin panel: overview, member management, schedule
  upload.
- `app/api/admin/schedule/route.ts` \u2014 handles the schedule image upload
  (multipart form, so it isn't a Server Action).

## Before you invite real members

Run the two impersonation checks in `03-rankings-themes-avatars.md` /
the earlier starter-code notes against your live database, with two real
member IDs, to confirm a member can never read another member's private
entry and the admin can never read an unshared one. RLS is what makes the
privacy promise on the profile page true \u2014 verify it once, for real,
before anyone's first entry.

## Known simplifications, worth knowing about

- Password recovery is admin-only (no email-based reset), because there's
  no self-registration and no real email addresses. Build the "reset
  password" admin flow early \u2014 it's here already, in `app/admin/users`.
- The leaderboard function walks each member's streak on every call. Fine
  for a few hundred members; past that, materialize it (see the comment in
  `0002_rankings_themes_avatars.sql`).
- Entry forms use a plain Server Action (`action={fn}`) rather than
  `useActionState`, so validation errors from the action aren't yet wired
  to the UI. Wire that up before launch if you want inline error messages
  rather than a silent no-op on failure.
