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
| **3.3.0** | Medal progress + rarity; Profile polish; Friends/leaderboards from Profile (Friends off tab bar); longest cardio distance secondary; week-share polish + share earned medal |
| **3.3.1** | Cardio PR composition; Profile friends route tree + tab highlight; Sign-in vs Profile; tab-bar clearance; medal unlock toasts |

## Current focus (see backlog Now)

- Pick from backlog **Next** (offline logging, medal award wiring, year wrapped, change password, …).

## Near term (backlog Next)

- Offline gym-floor logging; wire easy medal awards (share / friend / weigh-ins).
- **Year wrapped**; import for a year; programs complete; head-to-head week.
- Richer **share card family** (month / PR) beyond 3.3 week + medal share.
- Friends empty states / board naming if not finished in 3.3.

## Later

- Offline-capable medal once offline logging is real.
- Night/dawn medals only if local log time exists (not just calendar date).
- Grow live medals only as features land — roadmap ideas stay in `ACHIEVEMENT_ROADMAP` inside `packages/shared/achievements.ts`, not as fake locked UI.
- Opt-in calisthenics analytics tab; bodyweight day-card collapse after log.
- **v4 candidate:** native Expo client for integrations (Health, widgets, etc.) — web/PWA remains 3.x.

## Guardrails (stable)

Documented in [Product](./product.md) and backlog “Explicitly not doing.” Do not erode these without an explicit product decision.

## Related

- [`BACKLOG.md`](../BACKLOG.md) — Now / Next / Later checklist
- [Product](./product.md)
