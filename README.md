# UNZAHSSA Connect

Student portal for the University of Zambia Humanities & Social Sciences Students
Association — programmes, internships, forums, affiliations, academic queries.

## Running the code

```
npm i
npm run dev       # dev server
npm run build     # production build
npm run preview   # serve the production build (needed to test the PWA)
```

## Backend — Supabase

The app talks directly to Supabase (`@supabase/supabase-js`) — no custom API server.

- **Client**: `src/app/lib/supabase.ts`, configured from `.env`
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Both are public; never put a
  service-role key in `.env`.
- **Auth**: `src/app/lib/auth.tsx` — Supabase Auth (email + password). A DB trigger
  creates a `profiles` row per new user and auto-confirms the email so sign-up logs
  the user straight in. Admin vs student is the `profiles.role` column.
- **Data layer**: `src/app/lib/data.ts` — one async module per table
  (`profiles`, `programmes`, `branding`, `news_posts`, `forum_posts`,
  `forum_replies`, `payments`, `academic_queries`, `student_documents`,
  `audit_logs`). Every table has Row-Level Security: students see only their own
  rows, admins see everything (`public.is_admin()`).
- **Storage**: internship documents go to the private `internship-docs` bucket,
  keyed by `{userId}/…`.
- Schema lives in Supabase migrations (`init_core_schema`, `backfill_from_kv`, …).
  `supabase/functions/` and `supabase/kv_store_backup_2026-09-06.json` are the
  retired KV-store backend, kept for reference only.

### Manual Supabase settings (dashboard)

- **Authentication → URL Configuration**: add the deploy origin(s) and
  `<origin>/reset-password` to the redirect allow-list (password-reset links).
- **Authentication → Password**: enable *Leaked password protection* (recommended).
- To make someone else an admin:
  `update profiles set role = 'admin' where email = '…';`
- The old `make-server-4c6c639d` edge function is unused — delete it under
  **Edge Functions** when convenient.

## Progressive Web App

`vite-plugin-pwa` generates the service worker + manifest at build time
(`registerType: 'autoUpdate'`, disabled in dev). App shell is precached and SPA
deep links fall back to `index.html` offline. Config in `vite.config.ts`; icons in
`public/icons/` and `public/apple-touch-icon.jpg`.
