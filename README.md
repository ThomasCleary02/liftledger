# LiftLedger

Day-based workout tracker shipped as a **web PWA** (`web/`). Log strength, cardio, and calisthenics; use analytics, friends, and leaderboards. Primary surface: `/day/today`.

The Expo app in `expo-app/` is an **archived artifact**, not the product.

## Docs (start here)

| | |
|---|---|
| **Knowledge base** | [`docs/README.md`](./docs/README.md) |
| **Agents / LLMs** | [`AGENTS.md`](./AGENTS.md) · [`docs/agent-workflow.md`](./docs/agent-workflow.md) |
| **What to ship next** | [`BACKLOG.md`](./BACKLOG.md) |
| **Phases over time** | [`docs/roadmap.md`](./docs/roadmap.md) |

## Quick start

Requires **Java 21+** (Firebase emulators) and Node 22.

```bash
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000). Yellow bar = emulators. Emulator UI: [http://127.0.0.1:4000](http://127.0.0.1:4000). Sign up a throwaway account. Details: [`docs/development.md`](./docs/development.md).

## Layout

```
web/                 Next.js PWA (the product)
packages/shared/     Shared Firestore + analytics + identity
expo-app/            Archived React Native client
docs/                Product & engineering knowledge base
scripts/             Emulators, e2e, migrations, PWA assets
```

## Deploy

- **PWA:** Netlify (`netlify.toml`) — [`docs/hosting.md`](./docs/hosting.md)
- **Firebase:** project `lift-ledger-8f627` — rules/indexes via `npm run deploy:firestore*`
