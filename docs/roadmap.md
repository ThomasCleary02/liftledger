# Roadmap

Narrative of where the product has been and where it is headed. **Execution order** for the next few ships stays in [`BACKLOG.md`](../BACKLOG.md). Update backlog often; update this when a phase actually lands or strategy shifts.

## Shipped (recent)

| Phase | Themes |
|---|---|
| **3.1.x** | Real PWA icons / offline shell; gym-floor copy; Strength not filtered by My exercises; emulator Playwright |
| **3.2.0** | Dialog focus / keyboard a11y; Settings tips |
| **3.2.1** | Comma-grouped totals; pace + speed dual display |
| **3.2.2** | Cardio PR name/id matching; sheet search focus stability |
| **3.2.3** | Exercise identity (treadmill twins, run/jog labels); all-time PR load; week share that works on mobile; logged-first My exercises |
| **3.2.4** | Move tracking mismatch UX into My exercises; PR empty/loading fix; share preview stays in-app; docs + agent workflow (skills, rules, hooks) |

## Current focus (see backlog Now)

- Gym-floor **offline logging** (precache day shell + Firestore cache write-through).
- Wire medals the product already supports (week share, first friend, twelve weigh-ins) without inventing new surfaces.

## Near term (backlog Next)

- **Year wrapped** — one-time January recap; not a tab-bar feature; ledger-voiced.
- Import strong enough to prove a year of history.
- Starter programs with real complete state.
- Head-to-head week on leaderboards.

## Later

- Offline-capable medal once offline logging is real.
- Night/dawn medals only if local log time exists (not just calendar date).
- Grow live medals only as features land — roadmap ideas stay in `ACHIEVEMENT_ROADMAP` inside `packages/shared/achievements.ts`, not as fake locked UI.

## Guardrails (stable)

Documented in [Product](./product.md) and backlog “Explicitly not doing.” Do not erode these without an explicit product decision.

## Related

- [`BACKLOG.md`](../BACKLOG.md) — Now / Next / Later checklist
- [Product](./product.md)
