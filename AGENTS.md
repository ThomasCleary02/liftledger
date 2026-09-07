# AGENTS.md

LLM / agent entry for **LiftLedger**.

## Read first

1. [`docs/README.md`](./docs/README.md) — map of all durable docs  
2. [`docs/product.md`](./docs/product.md) — product rules and non-goals  
3. [`docs/architecture.md`](./docs/architecture.md) — where code lives  
4. [`BACKLOG.md`](./BACKLOG.md) — what to ship next (tactical)
5. [`docs/pitfalls.md`](./docs/pitfalls.md) — recurring PWA / identity / analytics footguns
6. [`docs/agent-workflow.md`](./docs/agent-workflow.md) — skills, rules, hooks

Then open [data model](./docs/data-model.md), [development](./docs/development.md), or [hosting](./docs/hosting.md) as needed.

## Hard product constraints

- My exercises filters **PRs only**, not Strength/Cardio.
- Do not merge barbell/Smith/machine or run/walk PRs; do not invent volume-as-PR.
- Do not show unfinished roadmap medals as locked on profile.
- Day dates are **local** `YYYY-MM-DD`; storage units are **lb / miles**.

## Working norms

- Prefer small, proven fixes over speculative PR math.
- Put shared logic in `packages/shared` with tests.
- Do not commit or push unless the user asks.
- Releases: bump versions + tag `vX.Y.Z` (see [hosting](./docs/hosting.md)).
- Before release: run skill **pre-release-checklist** (or `/pre-release`) and fix P0s.
- To publish a version after that: skill **ship-release** (or `/ship-release`) — only when asked.

## Archived

`expo-app/` is not the product. Do not “revive” it unless explicitly asked.
