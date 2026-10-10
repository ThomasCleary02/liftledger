# Product backlog

One list. **Now** is next to ship. **Next** is planned. **Later** is parked until a feature exists. Medal ideas that are not live stay in `packages/shared/achievements.ts` (`ACHIEVEMENT_ROADMAP`) so they are not shown as fake locked medals.

Durable product/engineering knowledge lives in [`docs/`](./docs/README.md). Keep this file short.

## Now

**Target: 3.3.4 patch** — ship before weekend; then **3.4.0** Account & Auth. See also [`docs/release-plan-3.3.4.md`](./docs/release-plan-3.3.4.md).

### Bugs & day log
- **Calisthenics input width fix** - When +lbs is shown, row is too wide and X gets cut off. Wrap/narrow on mobile.
- **Stair Stepper / Step Master** - Track **steps**, not miles. Optional `steps` on cardio; keep distance for run/walk/bike.
- **Day overview summary** - Collapsible end-of-day (or on-day) stats: volume, exercise count, cardio duration/distance/steps, PRs today — without leaving the day log.
- **Overview calisthenics card copy** - “reps in period” hint looks out of place vs peer Overview cards. Match layout.

### Search & discovery
- **Rank by personal history** - Boost hits the user has logged (identity aliases + session count). Favorites optional. Empty query: recent/frequent over A–Z.
- **Recent strip** - Last few logged lifts above results (companion to history ranking).
- **Soft modality chips** - Strength / Cardio / Calisthenics filter chips on search (not a full Settings redesign).
- **Stronger post-save hints** - Streak / “first leg day this week” style copy where cheap (logic mostly exists).

### Cardio PRs & taxonomy
- **Cardio PR display preference** - Pace, distance, or both on PR rows/cards.
- **Cardio classification audit** - Expand beyond `run|walk|bike|row|other` toward MapMy-style roots (elliptical, stair, swim, hike, machine cardio) without copying hundreds of subtypes. Still no run↔walk PR merge.

### Catalog
- **Machine naming & gaps** - Explicit floor names (Calf Raise Machine, Tricep Pushdown Machine, etc.).
- **Planet Fitness / Crunch / OneLife pass** - Selectorized + cable + smith gaps. Emulator JSON **and** production CLI upsert. Keep barbell / Smith / machine distinct.

### Medals
- **Platinum + Diamond + challenges (live)** - Hybrid C lifetime (Heartwood / Ninety / Half year rhythm + Evergreen / Two moons + Mileage club / Long haul / True dynasty / Year of iron / Smelter). Soft-retire stops new awards for `sessions_250` / `volume_2_5m`. Named challenges through Diamond (Foundry week, Iron month, Road siege, PR monsoon, Hybrid siege, Anvil month, Odyssey, Unbroken, True tempest, Ultramarathon week). Legendary deferred.
- Optional stretch: wire week-share / first-friend / twelve-weigh-ins awards if hooks are cheap.

### Share cards
- **Better week (and medal) share PNGs** - Clearer hierarchy, typography, tier-aware styling, week key stats not only calendar.
- **In-app share preview** - Always preview before/with OS share; Confirm / Share / Save. Optional swipe between week vs medal card.

### Analytics polish
- **Period date range under chips** - e.g. “Mar 10 – Mar 16” under 7d/30d/1y.
- **Stickier Analytics sub-tabs** while scrolling (small CSS).
- **Leaderboards: distance by family** - Keep Volume + Consistency. Today’s “cardio” board is actually **duration** (fair across modalities) — rename honestly. Add distance boards split by comparable families: **Foot miles** (run+walk+hike), **Bike miles**, Row only if distance is trustworthy else time, **Stairs steps** (pairs with stair `steps` field). Optional Run/Walk sub-chips under Foot; still no run↔walk PR merge. UI: Time + Distance family chips; hide/empty-state families with no data. Shared: `getCardioDurationLeaderboard` + `getCardioDistanceLeaderboard(..., family)`.

### Empty / tips
- **Empty states** - One better each: Analytics (no workouts), Profile friends, Templates.
- **Tip** - Settings tip that search learns from history once ranking ships.

**Weekend next: 3.4.0 - Account & Auth Polish**

- **Password reset** - Improve visibility/flow of existing reset email feature.
- **Email change** - Allow users to update their sign-in email from Settings → Account.
- **OAuth sign-in methods** - Add Google, Apple, and GitHub authentication options alongside email/password.
- **Account settings hierarchy** - Make Settings → Account more prominent, group related items.

## Next

**Rebrand (decide before any native/store release):** ~15 store apps share the LiftLedger name.
- **Pick a name:** short, distinctive, fits medals/progress. Gate each candidate on: Play/App Store search, USPTO trademark search, `.app`/`.com` domain, social handles.
- **Visible branding only:** wordmark (`BrandMark`), manifest name/short_name, page titles/metadata, Settings footer, share PNGs, marketing/legal pages, contact email, docs. Regenerate icons/splash via `node scripts/generate-pwa-assets.mjs` (single source of truth).
- **Do not rename internals:** Firebase project `lift-ledger-8f627`, `@liftledger/*` packages, localStorage keys (`@liftledger:preferences`, `liftledger.tip.*`) — renaming resets prefs/tips for no user benefit.
- **Domain move:** new domain primary on Netlify; 301 `liftledger.fit` → new domain for ≥1 year; add new domain to Firebase Auth authorized domains before switching; update `NEXT_PUBLIC_BASE_URL`.
- **Installed PWAs:** home-screen name/icon may not refresh until reinstall on iOS — note in release notes.

**After 3.4.0:**

- Gym-floor offline logging: precache day shell + Firestore cache write-through.
- Wire medals the product already supports (week share, first friend, twelve weigh-ins) — if not absorbed in 3.3.4.
- **Year wrapped** (+ light calisthenics line if earned). Persist `wrappedYearSeen`. Not a tab.
- Import that can prove a year of history.
- Starter programs with a real complete state.
- Head-to-head week on leaderboards.
- **Share card visual enhancements (phased):**
  - Phase 1 (week/medal PNG polish + **in-app preview**) ships in **3.3.4**.
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
- **Exercise search filters** - Deeper muscle-group filters beyond 3.3.4 soft modality chips.
- **Medal UI extras** - Rarity %, opt-in progress bars (tier grouping + detail sheet ship in 3.3.4).
- **Analytics charts expansion** - Muscle group breakdown chart, cardio distance/duration trends, bodyweight trend line if tracking enabled.
- **Progress hints expansion** - Beyond the light post-save hints in 3.3.4.
- **Profile enhancements** - Avatar preview before save, bio field option, friend search/filter.
- **Day log polish** - Bodyweight quick-add without navigating to settings, bodyweight trend on day page if tracking enabled.

## Later

Durable medals philosophy: [`docs/medals.md`](./docs/medals.md) (one idea → one medal; lifetime vs challenge; no ROADMAP ghosts).

- Offline-first medal (“Quiet gym”) once offline logging works.
- Night/dawn medals if we store local log time.
- More medals as features land — do not grow the live catalog in bulk.
- **Medal design:** enough easy badges already. New medals should be a **distinct story** (harder bar, creative name, or new feature) — not another twin of sessions/volume/cardio. Prefer soft-retire before adding. Live cardio ladder: **Engine** (10h) → **Heartwood** (30h) → **Long haul** (50h). Lifetime **Mileage club** (100 mi run) + **Ground game** (100 mi foot). Race run windows never merge walk miles; foot umbrellas may combine run+walk+hike for work medals only.
- **Lifetime milestones (sparse):** Named career floors only. Platinum + Diamond live (incl. Evergreen, Two moons, Smelter, Year of iron, Ground game). Soft-retired: Quarter thousand / Two and a half million / PR burst ladder / Road fever & Road siege / Stair spark & Plank pulse (history only). **Master** (or Champion) then **Legendary** reserved after Diamond — no live defs yet.
- **Challenge medals:** Fixed windows / bursts with unique names — not infinite tier ladders. Hard challenges count trained days only (rest does not fill; Unbroken breaks on rest). No N-PRs-in-M-days ladders. Live set in medals.md (lean: Foundry Silver, Rep siege Gold, modality umbrellas).
- **Custom challenges (Later):** MapMyWalk-style user goals OK for retention. Official medals only for *meta* engagement (create first goal / complete N goals) — never one catalog medal per custom goal.
- **Progression system expansion (multi-phase):**
  - **Phase 2 (later):** Profile XP / ranks / titles — XP accumulates from training sessions, unlocks ranks and titles visible on profile. Inspired by Laracasts/Boot.dev: useful tool + fun progression that recognizes real work, not arbitrary gamification.
  - **Phase 3 (much later, if traction/users):** Quests / daily–weekly goals that encourage healthy patterns (muscle-group coverage, streaks, new exercises, PRs). Optional habit layer — separate from unique challenge medals.
  - **Phase 4 (long-term, community-dependent):** Forum / community platform (Laracasts-style) — discuss training, share achievements, show off rare medals. Needs real user base + moderation.
- **Customizable Analytics Overview:** let users choose which stat widgets/cards to show (volume, cardio distance/duration, calisthenics reps/holds, bodyweight, etc.). Pairs with exposing more calisthenics metrics.
- **Calisthenics analytics (opt-in)** — not a mandatory Strength/Cardio peer.
- Template editor: nested sheet Back vs Done; calisthenics templates thinner than day log (pairs with hold timer).
- **Catalog search keywords for brands / gym names:** optional hidden `keywords` on catalog entries (e.g. "Hammer Strength", Planet Fitness machine names) so search finds the generic exercise. Do **not** add brand-named catalog rows — splits PRs and bloats the catalog.
- **Per-gym tag (later):** optional gym on a day for people who train at multiple gyms; machine loads aren't comparable across gyms, so this is the right axis for separating machine PRs if ever needed.
- **Global leaderboards** - Competition beyond friends. Could add friends from leaderboard. Privacy settings: discoverable by email only, opt-out of global boards, etc. Needs careful privacy design before shipping.
- **AI Training Chat (premium beta — owner + 1 tester):** goal is learning, not revenue; never lose more than the prepaid API balance.
  - **Access = premium custom claim:** Firebase Auth custom claim `premium: true`, granted by hand via `node scripts/set-premium.cjs <email>` (`--revoke` to remove; Firebase CLI auth like the catalog seed). **Never** store premium on `accounts/{uid}` — users can write their own account doc. New claims show after token refresh (≤1h or sign out/in).
  - **Server enforces, UI only hides:** Firebase Function (`functions/`, Blaze plan, deployed separately — Netlify ignores it) rejects any request without `premium` on the verified ID token. Client reads the same claim to show/hide the `/ai-chat` entry; that is cosmetic, not security.
  - **Spend ceiling:** prepaid provider API balance (e.g. $10), **auto-reload off**. Key lives only in Functions secrets, never in the client bundle.
  - **Caps:** per-user daily question limit (~20, tracked server-side in Firestore, not client-writable); per-request `max_tokens` + compact training summary instead of full history; small/cheap model by default. Expected worst case ≈ $5–10/month for 2 users at cap — check current model pricing.
  - **Tools (read-only, user-scoped):** `get_user_stats`, `get_recent_workouts`, `get_exercise_prs`, `get_medal_progress`. No writes back to logs in beta.
  - **UI:** simple chat at `/ai-chat` with message history; show "questions left today."
  - **Later — Stripe prepaid credits (only if opened beyond friends):** Checkout → signed webhook (idempotent) grants claim or credit balance → Function deducts actual usage atomically; zero balance = refuse. No pay-as-you-go billing.
  - **Decision point:** after ~1 month, keep / expand / sunset based on actual use and spend.
- Native Expo integrations → candidate **v4**.

## Challenge medal ideas (Later — distinct stories)

See [`docs/medals.md`](./docs/medals.md). Each row is a **named window**, not a Bronze→Legendary twin of the same metric. Rest days do not count for hard challenges. Earn the story you finish.

**Daily push-ups (habit windows)** — pick one story at a time if/when shipped:
- Week spark: 50/day × 7 · Fortnight: 75/day × 14 · Three-week grind: 100/day × 21 · Month siege: 100/day × 28

**Volume windows** (v1 live — see medals.md):
- **Volume blitz** — 25k lb in any 7 days (live)
- **Volume siege** — 50k lb in any 14 days (live)
- Later stretch stories only if distinct (e.g. multi-month campaign with its own name) — not Blitz II/III

**Distance:**
- **Distance demon** — 10 mi run in any 7 days (live); never merge walk miles
- **Footwork** — 40 mi foot (run+walk+hike) in any 14 days (live)
- **Sidewalk stroll** / **Ridge day** / **Spin spark** — modality identity (live)
- **Odyssey** — 75 mi run in any 30 days (live Platinum)
- **Ultramarathon week** — 40 mi run in any 7 days (live Diamond)
- **Mileage club** — 100 mi lifetime run (live Diamond); never merge walk miles
- **Ground game** — 100 mi lifetime foot (live Platinum)
- Soft-retired: Road fever, Road siege, Stair spark (history only)

**PR stories** (improvements, not openers; no N-in-M-days bursts):
- Soft-retired: PR spark / weather / monsoon / tempest / Five PRs
- **Return fire** — true PR within 14d after ≥21d off (live)
- **Same fight** / **Stale kill** — consistency / long-horizon (live)
- **True PR** / **PR machine** / **True dynasty** — lifetime floors (live)

**Trained-day / hybrid / cali challenges:**
- **Iron fortnight** — 10 trained days in any 14d (live; rest does not preserve)
- **Hybrid month** — ≥20k lb volume and ≥60 min cardio in the same 30d window (live; dual floors honest)
- **Hybrid siege** — ≥40k lb + ≥2h cardio same 30d (live)
- **Foundry week** — 40k lb / 7d (live Silver)
- **Rep siege** — 500 calisthenics reps / 7d (live Gold)
- **Push-up week** — 150 push-up reps / 7d (live Silver identity)
- Soft-retired: Plank pulse

## Explicitly not doing

- Merging barbell / Smith / machine into one PR.
- Combining run and walk PRs.
- Volume-as-PR.
- A settings toggle to “simplify” exercise variants.
- Showing **ROADMAP** medals as locked/unearned on the profile (ideas stay in code only).
- Making calisthenics a mandatory third peer of Strength/Cardio for everyone.
- A social feed or public share gallery (share cards stay one-off images).
