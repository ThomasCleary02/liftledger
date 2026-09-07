# LiftLedger docs

Scannable knowledge base for humans and LLMs. Start here, then open the page you need.

| Doc | Use when you need… |
|---|---|
| [Product](./product.md) | What the app is, surfaces, non-goals |
| [Architecture](./architecture.md) | Monorepo layout, web ↔ shared, routes, providers |
| [Data model](./data-model.md) | Firestore collections, day shape, identity rules |
| [Development](./development.md) | Local run, tests, conventions |
| [Hosting](./hosting.md) | Netlify + Firebase deploy |
| [Roadmap](./roadmap.md) | Shipped phases + future direction |
| [Pitfalls](./pitfalls.md) | Recurring bugs (PWA keyboard, identity, SW, share) |
| [Agent workflow](./agent-workflow.md) | Skills, rules, hooks, efficient loops |

**Tactical planning** (what to ship next) lives in root [`BACKLOG.md`](../BACKLOG.md) — keep that short. Do not duplicate Now/Next lists into these docs; link instead.

**LLM entry:** root [`AGENTS.md`](../AGENTS.md).

**Commands:** `/pre-release` (audit) · `/ship-release` (bump/tag after you ask).
