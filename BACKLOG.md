# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

**Target: 3.3.3 - Bug Fixes & Polish** (Prioritize before 3.4.0)

- **Calisthenics input width fix** - When +lbs field is shown (weighted push-ups, etc.), row is too wide and X button gets cut off screen. Reduce field widths or wrap to two rows on mobile.

**Next: 3.4.0 - Account & Auth Polish**

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
- **Share card visual enhancements (phased):**
  - **Phase 1 - Enhanced static PNGs:**
    - Tier-specific gradients/effects (Bronze = copper gradient, Silver = metallic shine, Gold = rich highlights, Platinum = silver sparkle, Diamond = prismatic blue, Ledgendary = rainbow/animated gradient effect)
    - Better typography (bolder numbers, modern fonts, drop shadows)
    - Visual hierarchy improvements (larger achievement focus, mini charts, better whitespace)
    - Week overview redesign with key stats, not just calendar grid
    - Month share card with similar visual style
  - **Phase 2 - Animated GIFs for special occasions:**
    - Medal unlock celebrations (spinning medal with shine effect, ~2-3 sec loop)
    - New PR achievements (confetti + counter animation)
    - Challenge completions (progress bar filling animation)
    - Keep regular weekly/monthly shares as PNG (reliability over flash)
    - Optimize file size, only use for big milestones
  - **Phase 3 - Advanced formats:**
    - Video option for year-end wrapped
    - Interactive web preview before sharing (customize colors, toggle stats)
    - Multiple export formats (square for Instagram, portrait for Stories, landscape for Twitter)
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
- **Medal tier expansion:**
  - **Platinum (tier 4), Diamond (tier 5), Ledgendary (tier 6)** - Extend existing medal progression with higher thresholds. Same medal types (sessions, volume, cardio, streaks, challenges), just harder. User has 150+ sessions, 30+ hr cardio, 400k+ volume — current caps at tier 3 (Century: 100 sessions, Engine: 10 hr, Quarter million: 250k lb).
  - **Challenge medals (all tiers)** - New medal category: specific dedication challenges. Bronze/Silver/Gold/Platinum/Diamond/Ledgendary tiers, progressively harder. Examples: Daily push-ups for 7/14/21/28/60/90 days. If you make it 20 days but miss one, you still earn the tier you completed (Gold = 21 days), not nothing. Ledgendary = month+ challenges requiring serious dedication.
  - **Important:** Hard challenge medals cannot use rest days to preserve streak. Must be actual trained days. Design these after tier 4/5 numeric medals ship.
- **Progression system expansion (multi-phase):**
  - **Phase 2 (later):** Profile XP / ranks / titles — XP accumulates from training sessions, unlocks ranks and titles visible on profile. Inspired by Laracasts/Boot.dev: useful tool + fun progression that recognizes real work, not arbitrary gamification.
  - **Phase 3 (much later, if traction/users):** Quests / challenges — daily/weekly goals that encourage healthy training patterns (hit all muscle groups, maintain streaks, try new exercises, PRs). Optional engagement layer that guides good habits.
  - **Phase 4 (long-term, community-dependent):** Forum / community platform (Laracasts-style) — place to discuss training, share achievements, show off badges/ranks/Ledgendary status. Only viable with real user base and moderation capacity. Gives progression system a social showcase.
- **Customizable Analytics Overview:** let users choose which stat widgets/cards to show (volume, cardio distance/duration, calisthenics reps/holds, bodyweight, etc.). Pairs with exposing more calisthenics metrics.
- **Calisthenics analytics (opt-in)** — not a mandatory Strength/Cardio peer.
- Template editor: nested sheet Back vs Done; calisthenics templates thinner than day log (pairs with hold timer).
- **Global leaderboards** - Competition beyond friends. Could add friends from leaderboard. Privacy settings: discoverable by email only, opt-out of global boards, etc. Needs careful privacy design before shipping.
- Native Expo integrations → candidate **v4**.

## Challenge Medal Ideas (All Tiers - Design Later)

Specific dedication challenges with tiered progression. Rest days don't count for hard challenges. If you fail mid-way, you keep the tier you completed.

**Daily Push-Up Challenge:**
- Bronze: 50 push-ups/day × 7 days (350 total)
- Silver: 75 push-ups/day × 14 days (1,050 total)
- Gold: 100 push-ups/day × 21 days (2,100 total)
- Platinum: 100 push-ups/day × 28 days (2,800 total)
- Diamond: 100 push-ups/day × 60 days (6,000 total)
- **Ledgendary: 100 push-ups/day × 90 days (9,000 total)** - requires months of dedication

**Volume Blitz:**
- Bronze: 25k lb in one week
- Silver: 50k lb in two weeks
- Gold: 75k lb in three weeks
- Platinum: 100k lb in one month
- Diamond: 200k lb in two months
- **Ledgendary: 500k lb in three months** - sustained intensity

**Distance Demon (Running):**
- Bronze: 10 miles in one week
- Silver: 25 miles in two weeks
- Gold: 50 miles in one month
- Platinum: 75 miles in one month
- Diamond: 100 miles in one month
- **Ledgendary: 200 miles in two months** - marathon-level commitment

**PR Machine:**
- Bronze: 3 PRs in 7 days
- Silver: 5 PRs in 14 days
- Gold: 8 PRs in 21 days
- Platinum: 10 PRs in 30 days
- Diamond: 15 PRs in 45 days
- **Ledgendary: 25 PRs in 60 days** - constant progression

**Iron Streak (No Rest Days):**
- Bronze: 7 consecutive trained days
- Silver: 14 consecutive trained days
- Gold: 21 consecutive trained days
- Platinum: 30 consecutive trained days
- Diamond: 45 consecutive trained days
- **Ledgendary: 60 consecutive trained days (no rest)** - extreme dedication

These scale from achievable (Bronze) to grueling (Ledgendary). Emphasize competitiveness and engagement. You earn credit for the tier you complete, even if you don't make it to the top.

## Explicitly not doing

- Merging barbell / Smith / machine into one PR.
- Combining run and walk PRs.
- Volume-as-PR.
- A settings toggle to “simplify” exercise variants.
- Showing **ROADMAP** medals as locked/unearned on the profile (ideas stay in code only).
- Making calisthenics a mandatory third peer of Strength/Cardio for everyone.
- A social feed or public share gallery (share cards stay one-off images).
