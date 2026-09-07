# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

_(empty — pick from Next when ready)_

## Next

- Gym-floor offline logging: precache day shell + Firestore cache write-through.
- Wire medals the product already supports (week share, first friend, twelve weigh-ins) — pairs well with progress UI once those hooks exist.
- **Year wrapped** (+ light calisthenics line if earned). Persist `wrappedYearSeen`. Not a tab.
- Import that can prove a year of history.
- Starter programs with a real complete state.
- Head-to-head week on leaderboards.
- **Share card family** (month / PR cards beyond week + medal).
- Friends empty states / leaderboard label fix (cardio board is duration).
- **Change password** in-app (Settings → Sign-in), for email/password accounts.

## Later

- Offline-first medal (“Quiet gym”) once offline logging works.
- Night/dawn medals if we store local log time.
- More medals as features land — do not grow the live catalog in bulk.
- **Calisthenics analytics (opt-in)** — not a mandatory Strength/Cardio peer.
- **Bodyweight UI refine** — compact “logged · edit” after save on the day page.
- Native Expo integrations → candidate **v4**.

## Explicitly not doing

- Merging barbell / Smith / machine into one PR.
- Combining run and walk PRs.
- Volume-as-PR.
- A settings toggle to “simplify” exercise variants.
- Showing **ROADMAP** medals as locked/unearned on the profile (ideas stay in code only).
- Making calisthenics a mandatory third peer of Strength/Cardio for everyone.
- A social feed or public share gallery (share cards stay one-off images).
