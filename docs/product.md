# Product

LiftLedger is a **day-based workout tracker** shipped as a **web PWA** (`web/`). Primary log surface: `/day/today`.

Native Expo (`expo-app/`) is an **archived artifact** — not marketed, not shipped.

## Who it is for

People who log strength, cardio, and calisthenics by calendar day, then check progress, friends, and personal records without gym-jargon chrome.

## Core surfaces

| Surface | Route(s) | Job |
|---|---|---|
| Day log | `/day/[date]`, `/day/today` | Add/edit lifts, rest, notes, bodyweight |
| Analytics | `/analytics` | Overview / Strength / Cardio / PRs |
| Profile | `/profile`, `/profile/friends`, `/profile/friends/leaderboards` | Avatar, username, medals, friends, leaderboards |
| Settings | `/settings`, `/settings/account` (sign-in email), `/settings/import` | Prefs, favorites, My exercises, templates, import/export |
| Admin | `/admin/exercises` | Catalog maintenance (admin emails) |
| Marketing | `/`, `/login`, `/privacy`, `/terms`, `/contact` | Public site + auth |

## Important product rules

- **Favorites** pin exercises at the top of search. They do not filter analytics.
- **My exercises** only shortens the **PRs** tab. Strength and Cardio stay full history for the selected period.
- **PRs are all-time** once history is loaded. Month/Year/7d chips apply to Overview / Strength / Cardio only.
- Weights and distances are stored as **pounds and miles**; convert at the form edge for metric display.
- Day ids use the user’s **local calendar date**, not UTC (`userId_YYYY-MM-DD`).
- **Simple by default:** the day log should stay calm for newcomers. Power features (hold times, supersets, rest timer, etc.) should be opt-in or contextual — not always-on chrome. Prefer a short “Training extras” group in Settings over a toggle farm. Hold time and supersets are opt-in; rest timer defaults off. This is not a “simplify exercise variants” switch (still a non-goal).

## Explicit non-goals

See also [`BACKLOG.md`](../BACKLOG.md) “Explicitly not doing”:

- Do not merge barbell / Smith / machine into one PR.
- Do not merge run and walk PRs.
- Do not treat volume as a PR.
- Do not add a “simplify variants” settings toggle.
- Do not show unfinished / roadmap medals as locked on the profile.

Near-duplicate **labels** that *are* treated as one movement for PRs (see [data model](./data-model.md#exercise-identity)): Run/Running/Jog, Walk/Walking, Treadmill ↔ Treadmill Run. That is identity hygiene, not “merge all cardio.”

## Related

- Planning: [`BACKLOG.md`](../BACKLOG.md)
- Direction over time: [Roadmap](./roadmap.md)
- Tech shape: [Architecture](./architecture.md)
