# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge (architecture, data model, hosting, roadmap narrative) lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

- Gym-floor offline logging: precache the day shell and write through Firestore cache so a workout can be logged without a connection.
- Wire a few medals that the product already supports (week share, first accepted friend, twelve weigh-ins) instead of inventing new surfaces for them.

## Next

- **Year wrapped.** After Dec 31 (or first open in January), show a one-time recap: sessions, streak, volume, top lift, cardio time, a few medals from that year. Persist `wrappedYearSeen` on the account so it fires once. Re-open from Profile or Settings (“Your 2026”). Do not put it in the tab bar. Keep it ledger-voiced, not Spotify-clone slides with fake drama.
- Import that can prove a year of history (needed for Ghost writer and a richer wrapped).
- Starter programs with a real complete state.
- Head-to-head week on leaderboards (you vs one friend).

## Later

- Offline-first as a medal (“Quiet gym”) once logging works without network.
- Night/dawn medals if we store local log time, not just calendar date.
- More medals as features land — do not grow the live catalog in bulk.

## Explicitly not doing

- Merging barbell / Smith / machine into one PR.
- Combining run and walk PRs.
- Volume-as-PR.
- A settings toggle to “simplify” exercise variants.
- Showing unfinished medals on the profile.
