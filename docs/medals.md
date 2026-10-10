# Medals

Engagement design for profile medals. Implementation stays in `packages/shared/achievements.ts` (live catalog + `ACHIEVEMENT_ROADMAP`). Planning: [`BACKLOG.md`](../BACKLOG.md). Product rule: never show ROADMAP ideas as locked medals.

## Principles

| Rule | Meaning |
|---|---|
| **One idea → one medal** | Do not clone the same metric across Bronze→Legendary ladders. A harder bar needs a **new name and story**, not “Sessions IV”. |
| **Lifetime vs challenge** | **Lifetime** = cumulative career (sessions, volume, streaks). **Challenge** = fixed window / burst (week, month, rolling N days). Keep them visually distinct. |
| **Honest catalog** | Only evaluate and display live defs. Ideas sit in `ACHIEVEMENT_ROADMAP` until shipped — no fake locked ghosts. |
| **Creative names** | Prefer memorable titles over numeric labels (“Volume blitz”, not “25k week”). |
| **Share payoff** | Unlock → shareable card. Medals that nobody would post are lower priority. |
| **Sparse over complete** | Prefer soft-retire before adding. Target a lean live set — umbrellas + a few identity medals, not one medal per modality rung. |
| **Windows only when the window is the story** | Avoid N-PRs-in-M-days ladders (newbie-gain bias). Prefer long-horizon PR stories (stale kill, return fire, same fight). |

Hard challenges count **trained days only** (rest does not fill rolling trained-day bars; **Unbroken** breaks on rest).

## Cadence

| Cadence | Role | Examples |
|---|---|---|
| **Daily** | Rare; habit sparks, not spam | (deferred) |
| **Weekly** | Burst windows | Volume blitz, Foundry week, Ultramarathon week, Spin spark |
| **Monthly** | Sustained intensity | Anvil month, Hybrid siege, Iron month, Footwork |
| **Yearly** | Wrapped / season milestones | Year wrapped, Half year rhythm |
| **Lifetime** | Career floors | Century, Evergreen, Mileage club, Ground game, Year of iron |

Prefer a few strong windows over many overlapping thresholds on the same counter. Calibration: power-user bars (~150+ sessions, multi-week consistency, ~40+ mi short windows) should still feel challenging.

## Tiers (live)

| Tier | Label | Role |
|---|---|---|
| 1 | Bronze | Onboarding / early wins + hard bursts |
| 2 | Silver | Established habit + month challenges |
| 3 | Gold | Serious floors + gold challenges |
| 4 | **Platinum** | Named lifetime + hard challenge windows |
| 5 | **Diamond** | Sparse ceiling + aspirational challenges |

**Legendary** stays deferred — not in this release.

### Platinum lifetime (tier 4)

| ID | Title | Bar |
|---|---|---|
| `engine_30` | Heartwood | 30 hours cardio |
| `streak_90` | Ninety days | 90-day streak |
| `rhythm_26` | Half year rhythm | 26 weeks × ≥3 trained days |
| `evergreen_200` | Evergreen | 200 trained days (count, not streak) |
| `two_moons_60` | Two moons | 60-day streak |
| `ground_game_100` | Ground game | 100 mi **foot** (run+walk+hike) |

### Diamond lifetime (tier 5)

| ID | Title | Bar | Notes |
|---|---|---|---|
| `mileage_club_100` | Mileage club | 100 mi **run** only | No walk |
| `long_haul_50` | Long haul | 50 hours cardio | Beyond Heartwood’s 30h |
| `true_dynasty_50` | True dynasty | 50 true PRs | Beyond PR machine (15) |
| `year_of_iron_300` | Year of iron | 300 trained days | Named career floor |
| `smelter_1_5m` | Smelter | 1.5M lb volume | Between Million and retired 2.5M |

History-only forever (no new awards): `sessions_250`, `volume_2_5m`, PR burst ladder (`pr_spark_3`, `pr_weather_5`, `pr_monsoon_8`, `true_tempest_12`, `pr_repeat`), mid run twins (`road_fever_25`, `road_siege_50`), Bronze sparks soft-retired for lean catalog (`stair_spark_3k`, `plank_pulse_5`).

**Reserved tiers (not live):** after Diamond come **Master** (name TBD — Champion is an alt) then **Legendary**. Do not ship live defs or fake locked ghosts for them yet. Keep Diamond sparse so those ceilings still mean something.

Theme tokens: `packages/shared/medalTiers.ts` (grid + share PNG). Icons: Lucide keys on `AchievementIcon` (story, not tier). No tier section headers — color + sort carry rarity.

## Challenge set (live)

Distinct stories — not tier twins of the same metric. Windows match `packages/shared/achievements.ts`.

### Bronze / Silver / Gold

| Medal | Tier | Window | Hook | Notes |
|---|---|---|---|---|
| **Volume blitz** | 1 | Any 7d | 25k lb | Live |
| **Distance demon** | 1 | Any 7d | 10 mi **run** | No walk |
| **Sidewalk stroll** | 1 | Any 14d | 10 mi **walk** | Walk identity |
| **Spin spark** | 1 | Any 7d | 25 mi **bike** | |
| **Foundry week** | 2 | Any 7d | 40k lb | Promoted above Blitz |
| **Volume siege** | 2 | Any 14d | 50k lb | Not “Blitz Silver” |
| **Iron fortnight** | 2 | Any 14d | 10 trained days | Rest does not fill |
| **Return fire** | 2 | After ≥21d off | True PR within 14d of return | Long-horizon PR |
| **Footwork** | 2 | Any 14d | 40 mi **foot** | run+walk+hike |
| **Ridge day** | 2 | Any 14d | 8 mi **hike** | |
| **Push-up week** | 2 | Any 7d | 150 push-up reps | Bodyweight identity |
| **Hybrid month** | 2 | Any 30d | ≥20k lb + ≥60 min cardio same window | Dual floors honest |
| **Iron month** | 2 | Any 30d | 20 trained days | Rest does not fill |
| **Hybrid siege** | 3 | Any 30d | ≥40k lb + ≥2h cardio same window | Dual floors honest |
| **Rep siege** | 3 | Any 7d | 500 calisthenics reps | All cali — not push-only |

### Platinum / Diamond challenges

| Medal | Tier | Window | Hook | Notes |
|---|---|---|---|---|
| **Anvil month** | 4 | Any 30d | 120k lb | Not “Blitz Platinum” |
| **Odyssey** | 4 | Any 30d | 75 mi **run** | No walk |
| **Unbroken** | 4 | 21 consecutive trained days | Rest breaks the chain | Not calendar soft-streak |
| **Ultramarathon week** | 5 | Any 7d | 40 mi **run** | Aspirational |

### Lifetime PR stories (not burst windows)

| Medal | Tier | Hook |
|---|---|---|
| **True PR** | 1 | First improvement (not opener) |
| **Same fight** | 2 | True PR after ≥8 prior trained days on that lift |
| **Stale kill** | 3 | Beat a PR that stood ≥90 days |
| **PR machine** | 3 | 15 true PRs career |
| **True dynasty** | 5 | 50 true PRs career |

**Distance stance:** **foot miles** (run+walk+hike) for work medals; activity-specific tracks for identity; **few run-only** for race identity. Never merge run↔walk for **PRs**.

Partial credit: earn the story you finished — never invent locked higher twins on the profile.

## Later challenge stories

Ship **new stories**, not Blitz II / Demon II. Prefer one medal per idea; promote from `ACHIEVEMENT_ROADMAP` only when the feature exists (Posted the week · Scale witness · Quiet gym · Head to head · Goal setter / Goal keeper).

**Custom challenges (MapMyWalk-style):** user-defined goals are fine for engagement, but **do not** mint a unique catalog medal per goal. Only meta medals (create first goal, complete N goals) map into the official catalog — keeps medals rare and shareable.

Defer elliptical / swim / pull-up ladders / multi-rung modality cascades / stair+plank sparks until a clear story beats soft-retire hygiene.

## Soft-retire

- Live medals stay earned forever once awarded.
- Soft-retire = stop **promoting** and stop accepting **new** unlocks (`evaluateEarnedIds` skips `retired: true`); keep history + share for already earned. Active strip never surfaces retired defs.
- Prefer soft-retire over deleting ids.
- ROADMAP items are not retired — they were never live.

## UI

| Surface | Job |
|---|---|
| **Active strip** | In-progress challenges only. Empty if none — no ROADMAP teasers. Profile home only. Limit 5. |
| **Collection** | Earned + available live medals. Filters + sort by tier/title. No tier section headers. |
| **Detail sheet** | Name, tier label (Bronze…Diamond), description, earned date or progress; share CTA. |

## Phasing

| Phase | Ship |
|---|---|
| **A–C** | Principles, challenge hygiene, share cards (prior releases). |
| **Ceiling + expansion** | Platinum + Diamond + named challenges. |
| **Hygiene + diversity** | Soft-retire PR bursts + mid run twins; long-horizon PR stories; tight foot/walk/bike + cali set. |
| **Lean rebalance** | Foundry → Silver; Rep siege (Gold); soft-retire Stair/Plank sparks; Lucide icon variety. Master + Legendary reserved. |
