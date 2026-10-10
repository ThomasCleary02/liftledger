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
| **3.3.2** | Day-log polish (bodyweight compact, Change clears silent draft, hold Start/Stop); Training extras; plank longest-hold PRs; analytics/friends UX copy |
| **3.3.3** | Tab icon outline fix; hold-focused plank UI + larger Start/Stop; Overview calisthenics reps; catalog seed; day-menu tip; Netlify package.json-only builds |

## Current focus (see backlog Now)

- **3.3.4** this week — see [`release-plan-3.3.4.md`](./release-plan-3.3.4.md): bugs (calisthenics width, stair steps), day overview, search history ranking + recent strip, share PNG + preview, Platinum medals, cardio prefs/taxonomy, gym catalog, Analytics/empty polish, **leaderboard distance-by-family**.
- **3.4.0** weekend — Account & Auth (password reset visibility, email change, OAuth, Account hierarchy).

## Near term (backlog Next)

- **Rebrand** before any native/store presence — name crowded on Play Store. Visible branding + domain only; internal ids stay. See backlog Next.
- Offline gym-floor logging; wire easy medal awards (share / friend / weigh-ins).
- **Year wrapped**; import for a year; programs complete; head-to-head week.
- Richer **share card family** (month / PR) beyond 3.3 week + medal share.

## Later

- Offline-capable medal once offline logging is real.
- Night/dawn medals only if local log time exists (not just calendar date).
- Grow live medals only as features land — roadmap ideas stay in `ACHIEVEMENT_ROADMAP` inside `packages/shared/achievements.ts`, not as fake locked UI. Prefer **harder** grind medals (or feature-tied) over more easy badges; Engine (10 hr) is live; Mileage club / Long haul stay roadmap.
- Opt-in calisthenics analytics tab.
- **v4 candidate:** native Expo client for integrations (Health, widgets, etc.) — web/PWA remains 3.x.

## Future Vision: AI-Powered Training Insights

**MCP-Based Chat Interface** (post user traction, v4+ timeframe)

Natural language queries over user's training data via Model Context Protocol (MCP) server exposing Firebase/Firestore tools.

**Phase 1 - Read-Only Insights:**
- MCP server (Node.js + Firebase Admin SDK) with tools: `get_user_stats`, `get_exercise_prs`, `get_medal_progress`, `get_workout_by_date`, `compare_with_friend`, `search_exercise_catalog`
- Chat interface in PWA calling MCP server with user's Firebase auth token
- Natural language queries: "How many PRs this month?", "What's my squat progression?", "Am I close to any medals?"
- User scoped queries only (Firebase rules + token validation)

**Phase 2 - Recommendations:**
- "What should I train today?" based on history, recovery, muscle group balance
- "What exercises am I neglecting?" gap analysis
- Medal suggestions: "You're 2 sessions from Fifty Sessions badge"

**Phase 3 - Planning & Programming:**
- "Create a program to hit 300lb squat" - generates progressive overload plan
- "Design a 3-day split based on my history"
- Template generation from natural language

**Technical Considerations:**
- Beta first: Firebase Function gated by a manually granted `premium` custom claim, prepaid API balance with auto-reload off (see [`BACKLOG.md`](../BACKLOG.md) AI Training Chat). MCP server hosting (Cloud Run, Railway, Render) only if it outgrows that.
- LLM API costs (Claude/GPT) - monitor usage carefully
- Caching layer for common queries (reduce Firebase reads)
- Rate limiting per user
- Query optimization (batch reads, pre-aggregate stats)

**Strategic Fit:**
- Unique differentiator vs Strong/Hevy/FitNotes
- Aligns with engagement/competitiveness goals
- Surfaces insights users wouldn't discover manually
- Natural progression from static analytics to conversational AI
- Wait until solid user base to justify hosting/LLM costs

**Not Doing (Guardrails):**
- No AI that logs workouts for you (manual logging stays core)
- No AI-generated social feed (share cards stay one-off)
- No generic fitness advice (stay scoped to user's data)

## Guardrails (stable)

Documented in [Product](./product.md) and backlog “Explicitly not doing.” Do not erode these without an explicit product decision.

## Related

- [`BACKLOG.md`](../BACKLOG.md) — Now / Next / Later checklist
- [Product](./product.md)
