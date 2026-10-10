# Release Plan: 3.3.4 — Patch before weekend Auth

**Target:** 3.3.4 (patch)  
**Then:** 3.4.0 Account & Auth (weekend)  
**Status:** Implementation complete — ready for local smoke / pre-release  
**Shipped baseline:** 3.3.3

Canonical checklist: [`BACKLOG.md`](../BACKLOG.md) **Now**. This doc is the working release plan.

## Already on remote plan (keep)

| Item | Notes |
|---|---|
| Calisthenics +lbs width / X cut off | P0 mobile — shrink reps field (single row), don’t wrap |
| Stair Stepper / Step Master → **steps** | Optional `steps` on cardio; don’t force miles |
| Day overview summary | Collapsible on-day stats (volume, count, cardio, PRs today) |

## Added for this ship

### Search & day UX
- History-ranked search + recent strip + soft modality chips
- Light post-save hints (streak / muscle-day)
- Overview calisthenics card copy (drop awkward “reps in period”)

### Cardio
- PR display pref: pace / distance / both
- Classification audit (MapMy-style roots; elliptical/stair/swim/hike out of pure Other)

### Catalog
- Machine floor names + PF / Crunch / OneLife pass
- Emulator JSON **and** production CLI upsert (same as 3.3.3)

### Medals
- Platinum (tier 4) on live families
- Optional period-window Bronze–Gold slice
- Tier-grouped medal grid + tap detail (description + earned date)

### Share
- Phase 1 PNG polish (week + medal)
- **In-app preview** always (Confirm / Share / Save); optional week↔medal swipe

### Analytics / empty
- Date range under period chips; stickier sub-tabs
- Empty states: Analytics, friends, Templates
- Tip: search learns from history
- **Leaderboards distance-by-family** — rename current cardio board to duration; add Foot / Bike / (Row) miles + Stairs steps boards (depends on taxonomy + stair steps)

## Out of scope (weekend / later)

- Full Settings regroup, OAuth, email change → **3.4.0**
- GIF/video share, year wrapped, offline, charts expansion, Ledgendary tree
- Note: day-menu tip already shipped in **3.3.3** (don’t re-plan as net-new)

## Priority order (suggested)

1. **P0:** calisthenics width, stair steps model  
2. **P1:** search history ranking + recent strip, share preview + PNG polish, day overview  
3. **P1:** Platinum tier + medal grid grouping  
4. **P2:** cardio PR pref + taxonomy, catalog pass, Analytics chips/empty/tips, period medals, **leaderboard distance families** (after taxonomy + stair steps)

## Rollout

1. Pre-release checklist skill  
2. Bump to **3.3.4** (root / shared / web + lock + Settings footer)  
3. Tag `v3.3.4`, push — Netlify builds on `package.json` change  
4. Prod catalog upsert via CLI if catalog rows land  
5. Then start **3.4.0** Auth  

## Risks

- Stair `steps` vs legacy distance logs — keep `distance` optional; no hard migration required  
- 3.3.4 scope is large for a “patch”; cut from P2 if the week slips (catalog / period medals / taxonomy first to defer)  
- Share preview must not regress iOS PWA share (no `location.assign` to blob)
