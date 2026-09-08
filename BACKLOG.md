# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

**Target: 3.4.0 - Account & Auth Polish**

- **Password reset** - Improve visibility/flow of existing reset email feature.
- **Email change** - Allow users to update their sign-in email from Settings → Account.
- **OAuth sign-in methods** - Add Google, Apple, and GitHub authentication options alongside email/password.
- **Account settings hierarchy** - Make Settings → Account more prominent, group related items.

## Next

**After 3.4.0:**

- Gym-floor offline logging: precache day shell + Firestore cache write-through.
- Wire medals the product already supports (week share, first friend, twelve weigh-ins) — pairs well with progress UI once those hooks exist.
- **Year wrapped** (+ light calisthenics line if earned). Persist `wrappedYearSeen`. Not a tab.
- Import that can prove a year of history.
- Starter programs with a real complete state.
- Head-to-head week on leaderboards.
- **Share card family** (month / PR cards beyond week + medal).
- Analytics Overview **This week** strip: page/swipe to **previous weeks** (one week at a time; header shows which week; Share uses the selected week). Don’t turn it into a full history browser — period chips still own that.
- Day **notes** editor (product/import already support notes; day UI never exposes them).
- **Calisthenics hold duration analytics:** calculate and display total hold time alongside total reps. Complements reps visibility.
- **Settings redesign** - Group settings into logical sections (Account, Preferences, Training, Data, Help). See `docs/ux-audit-2026-09.md` for full mockup.
- **Enhanced empty states** - Better first-run experience for Analytics (no workouts), Profile (no friends), Templates (none created).
- **Exercise search improvements** - Recently used section, muscle group filters, modality tabs (Strength/Cardio/Calisthenics).
- **Medal UI enhancements** - Group medals by tier (Bronze/Silver/Gold sections), medal detail modal with earn date/rarity %, progress bars (opt-in).
- **Analytics charts expansion** - Muscle group breakdown chart, cardio distance/duration trends, bodyweight trend line if tracking enabled.
- **Progress hints expansion** - Celebrate streaks, note muscle group balance, volume milestones (beyond just PRs).
- **Profile enhancements** - Avatar preview before save, bio field option, friend search/filter.
- **Day log polish** - Bodyweight quick-add without navigating to settings, bodyweight trend on day page if tracking enabled.

## Later

- Offline-first medal (“Quiet gym”) once offline logging works.
- Night/dawn medals if we store local log time.
- More medals as features land — do not grow the live catalog in bulk.
- **Medal design:** enough easy badges already. New catalog medals should be **harder** (or creative / tied to a new feature). Cardio already has live **Engine** (10 hr). ROADMAP: **Mileage club** (100 mi run, no walk) and **Long haul** (50 hr cardio) in `ACHIEVEMENT_ROADMAP` — keep them ROADMAP until we deliberately promote.
- **Fourth tier** (Platinum?) for achievement system. User has 150+ sessions, 30+ hr cardio, 400k+ volume — current catalog caps at tier 3 (Century: 100 sessions, Engine: 10 hr, Quarter million: 250k lb). Need harder targets across all categories. Existing catalog: Bronze (tier 1), Silver (tier 2), Gold (tier 3).
- **Progression system expansion (multi-phase):**
  - **Phase 1 (nearer-term):** Extended medal tiers — Bronze → Silver → Gold → Platinum (tier 4) → Diamond (tier 5) → **Ledgendary** (tier 6). Top tier uses LiftLedger-branded name (like Valorant's Radiant / Apex's Predator). Elite achievements for dedicated long-term users.
  - **Phase 2 (later):** Profile XP / ranks / titles — XP accumulates from training sessions, unlocks ranks and titles visible on profile. Inspired by Laracasts/Boot.dev: useful tool + fun progression that recognizes real work, not arbitrary gamification.
  - **Phase 3 (much later, if traction/users):** Quests / challenges — daily/weekly goals that encourage healthy training patterns (hit all muscle groups, maintain streaks, try new exercises, PRs). Optional engagement layer that guides good habits.
  - **Phase 4 (long-term, community-dependent):** Forum / community platform (Laracasts-style) — place to discuss training, share achievements, show off badges/ranks/Ledgendary status. Only viable with real user base and moderation capacity. Gives progression system a social showcase.
- **Customizable Analytics Overview:** let users choose which stat widgets/cards to show (volume, cardio distance/duration, calisthenics reps/holds, bodyweight, etc.). Pairs with exposing more calisthenics metrics.
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
