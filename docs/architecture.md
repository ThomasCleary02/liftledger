# Architecture

## Monorepo

| Path | Role |
|---|---|
| `web/` | Next.js 15 PWA — **the product** (`liftledger-web`) |
| `packages/shared/` | `@liftledger/shared` — Firestore factories, analytics, achievements, import, units, cardio, exercise identity |
| `expo-app/` | Archived React Native client (same Firebase + shared) |
| `scripts/` | Emulators, seed catalog, e2e runner, PWA assets, historical migrations |
| Root | `firebase.json`, rules, indexes, `netlify.toml`, workspace `package.json` |

Workspaces: `packages/*`, `expo-app`, `web`.

## Web ↔ shared

- Shared is TypeScript source consumed directly (`"main": "./index.ts"`). Web sets `transpilePackages: ["@liftledger/shared"]`.
- Prefer deep imports for clarity: `@liftledger/shared/firestore/days`, `@liftledger/shared/analytics/calculations`.
- `web/lib/firebase.ts` constructs Firebase app + service factories (`createDayService`, `createAccountService`, …). Thin re-exports live under `web/lib/firestore/*`.
- Pure logic (PR math, units, identity, achievements) stays in shared so web and tests share one implementation.

## App structure (`web/`)

```
web/app/
  layout.tsx              AuthProvider + PreferencesProvider
  (marketing)/            Public pages (landing, login, legal)
  (app)/                  Authenticated shell (AppShell)
    day/[date]/
    analytics/
    friends/
    profile/
    settings/
    admin/exercises/
web/components/           UI (sheets, day chrome, search, …)
web/lib/                  Firebase wiring, caches, tips, share PNG, …
web/providers/Auth.tsx
web/public/               manifest, sw.js, offline.html, icons
```

No `middleware.ts`. Auth gating is client-side in app pages / shell.

## Client data pattern

- Browser Firebase SDK only (Auth, Firestore, Storage).
- `sessionCache` holds recent days / catalog for snappy navigation.
- Analytics loads period-scoped days for charts; **lifetime** history for PRs and week share.
- Legacy collection `workouts` is read-avoided for analytics — source of truth is `days`.

## PWA

- Manifest: `web/public/manifest.json` (`start_url: /day/today`, standalone).
- Service worker: `web/public/sw.js` (shell cache). Registered in production via `ServiceWorkerUpdate`; skipped in development so emulator restarts are not mistaken for offline.
- Offline fallback: `web/public/offline.html`.

## Related

- Collections: [Data model](./data-model.md)
- Run / test: [Development](./development.md)
- Deploy: [Hosting](./hosting.md)
