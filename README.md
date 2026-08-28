# LiftLedger

A day-based workout tracker. The product is a **web app / PWA** (`web/`). Log strength, cardio, and calisthenics, then use analytics, friends, and leaderboards.

The native Expo client in `expo-app/` is an **archived artifact**. It is not shipped. Keep it in the repo so that code is not lost; do not market it as the app.

## Layout

```
web/                 Next.js PWA (the product)
packages/shared/     Firestore services, analytics, units, insights
expo-app/            Archived React Native client
scripts/migrations/  One-shot historical migrations (already applied)
firestore.rules
firestore.indexes.json
```

Primary log surface: `/day/today`. Weights and distances are stored as **pounds and miles**; convert at the form edge when the user prefers metric.

## Run the web app

Local development is isolated. `npm run start` (from the repo root) boots the Firebase emulators and the Next.js app together. Auth, Firestore, and Storage stay on this machine. They cannot reach production.

Requires **Java 21+** (the emulator suite is a JVM process). First run downloads emulator binaries and can take a few minutes.

```bash
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000). The yellow bar means you are on emulators. Browse data at [http://127.0.0.1:4000](http://127.0.0.1:4000).

Sign up a throwaway account on the login page. The first start seeds a small exercise catalog into the emulator; later starts leave your local data alone. Ctrl+C stops both processes and exports data to `emulator-data/` for the next start.

`cd web && npm run dev` also targets emulators, but will fail if they are not running. Prefer `npm run start` from the root.

To point `next dev` at production anyway (not the default): set `NEXT_PUBLIC_USE_PRODUCTION=true` and fill `web/.env.local` from `web/.env.example`. Netlify production builds are unchanged.

Typecheck: `cd web && npm run type-check`

## Firebase

Project: `lift-ledger-8f627`

Auth: email/password. Firestore is the database.

```bash
npx firebase login
npm run deploy:firestore:rules     # security rules
npm run deploy:firestore:indexes   # composite indexes
npm run deploy:firestore           # both
```

Rules take effect immediately. Indexes can sit in “Building” for a few minutes.

`emailIndex/{email}` may only be written when the document id matches the signed-in user’s auth email. `usernameIndex/{username}` is first-claim; update/delete require that you already own the doc.

## Collections

| Collection | Role |
|---|---|
| `days/{userId}_{YYYY-MM-DD}` | Workouts and rest days (local calendar date, not UTC) |
| `workoutTemplates` | User templates |
| `exercises` | Global catalog (public read) |
| `accounts` | Profile, username, favorites |
| `emailIndex` | Friend lookup by email |
| `usernameIndex` | Friend lookup by username |
| `friends` | Bidirectional friendship |
| `friendRequests` | Pending / accepted / rejected |
| `workouts` | Legacy. Do not write. Analytics read `days` only. |

## Deploy the PWA

Netlify uses the root `netlify.toml` (`npm run build:web`, Node 22, Next plugin). Set `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and `NEXT_PUBLIC_BASE_URL` in the host.

## Archived Expo app

See [expo-app/README.md](./expo-app/README.md). Root scripts `npm run android` / `npm run ios` exist only to run that artifact.

## Historical migrations

See [scripts/migrations/README.md](./scripts/migrations/README.md). Do not re-run them against production unless you know why.
