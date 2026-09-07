# Development

## Prerequisites

- Node 22 (Netlify / local target)
- **Java 21+** for Firebase emulators
- `npm install` at repo root

## Default local loop

```bash
npm install
npm run start
```

Boots Auth / Firestore / Storage emulators + Next.js. Yellow bar = emulators. Emulator UI: http://127.0.0.1:4000. App: http://localhost:3000.

- Sign up a throwaway account (production Auth users are not in the emulator).
- First start seeds the exercise catalog into the emulator.
- Ctrl+C exports emulator data to `emulator-data/` for the next start.

Prefer root `npm run start` over `cd web && npm run dev` alone (dev without emulators fails or surprises).

Point Next at **production** Firebase only when intentional:

- `NEXT_PUBLIC_USE_PRODUCTION=true`
- `web/.env.local` from `web/.env.example`

## Tests

| Layer | Command | What |
|---|---|---|
| Unit (shared) | `npm test -w @liftledger/shared` | Vitest / node |
| Unit (web) | `npm test -w liftledger-web` | Vitest / jsdom |
| Firestore rules | `npm run test:rules` | Emulator + rules vitest |
| Full pre-commit style | `npm test` | Workspaces + rules |
| E2E | `npm run playwright:install` then `npm run test:e2e` | Playwright vs local emulators |

Typecheck: `npm run type-check` (workspaces) or `npm run type-check -w liftledger-web`.

## Conventions (agent-friendly)

- **Commit** only when asked; message style is short “why” sentences (see recent `v3.2.x` commits).
- **Do not** invent merge rules for exercise variants beyond `exerciseIdentity.ts`.
- UI copy: plain language; avoid ledger/crop jargon in user-facing strings.
- Sheets/dialogs: keep focus trap + `open`-stable effect deps (search fields must not remount every keystroke).
- Shared pure logic → `packages/shared` with tests; web wires Firebase and UI.
- Version bump for releases: root + `packages/shared` + `web` package.json, settings footer, lockfile workspace versions, tag `vX.Y.Z`.

## Related

- [Architecture](./architecture.md)
- [Hosting](./hosting.md)
- [Product](./product.md)
