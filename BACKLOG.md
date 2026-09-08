# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

_(empty — ship 3.3.2; see Next)_

## Next

- Gym-floor offline logging: precache day shell + Firestore cache write-through.
- Wire medals the product already supports (week share, first friend, twelve weigh-ins) — pairs well with progress UI once those hooks exist.
- **Year wrapped** (+ light calisthenics line if earned). Persist `wrappedYearSeen`. Not a tab.
- Import that can prove a year of history.
- Starter programs with a real complete state.
- Head-to-head week on leaderboards.
- **Share card family** (month / PR cards beyond week + medal).
- **Change password** in-app (Settings → Sign-in), for email/password accounts.
- Catalog: add **Russian Twist** (calisthenics/abs), **torso rotation machine** (strength/abs or obliques), and consider **bicycle crunch** (calisthenics/abs), **wood chop / cable chop** (strength/abs), **side bend** (strength/obliques). Confirm naming vs gym labels before shipping.
- Analytics Overview **This week** strip: page/swipe to **previous weeks** (one week at a time; header shows which week; Share uses the selected week). Don’t turn it into a full history browser — period chips still own that.
- Day **notes** editor (product/import already support notes; day UI never exposes them).
- **Plank UI refinement:** planks are static holds, not rep-based. Consider hiding or defaulting reps to 1, emphasizing hold duration + sets only. (Currently shows both reps + hold time, which is confusing for static exercises.)
- **Hold timer stop button:** increase touch target size (currently `min-h-[48px]` but may need larger padding/width for easier tapping mid-set).

## Later

- Offline-first medal (“Quiet gym”) once offline logging works.
- Night/dawn medals if we store local log time.
- More medals as features land — do not grow the live catalog in bulk.
- **Medal design:** enough easy badges already. New catalog medals should be **harder** (or creative / tied to a new feature). Cardio already has live **Engine** (10 hr). ROADMAP: **Mileage club** (100 mi run, no walk) and **Long haul** (50 hr cardio) in `ACHIEVEMENT_ROADMAP` — keep them ROADMAP until we deliberately promote.
- **Fourth tier** (Platinum?) for achievement system. User has 150+ sessions, 30+ hr cardio, 400k+ volume — current catalog caps at tier 3 (Century: 100 sessions, Engine: 10 hr, Quarter million: 250k lb). Need harder targets across all categories. Existing catalog: Bronze (tier 1), Silver (tier 2), Gold (tier 3).
- **Calisthenics analytics (opt-in)** — not a mandatory Strength/Cardio peer.
- Template editor: nested sheet Back vs Done; calisthenics templates thinner than day log (pairs with hold timer).
- Native Expo integrations → candidate **v4**.

## Explicitly not doing

- Merging barbell / Smith / machine into one PR.
- Combining run and walk PRs.
- Volume-as-PR.
- A settings toggle to “simplify” exercise variants.
- Showing **ROADMAP** medals as locked/unearned on the profile (ideas stay in code only).
- Making calisthenics a mandatory third peer of Strength/Cardio for everyone.
- A social feed or public share gallery (share cards stay one-off images).
