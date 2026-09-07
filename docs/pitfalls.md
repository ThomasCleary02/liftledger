# Pitfalls & recurring bugs

Living list of footguns agents and humans keep hitting. **Add new entries when a bug bites twice** (or once if PWA/keyboard/identity). Keep each item: symptom → cause → fix / rule.

Related code: `FullScreenSheet`, `SafeAreaInsets`, `fullScreenChrome`, `exerciseIdentity`, `shareWeekPng`, `ServiceWorkerUpdate`.

---

## PWA / viewport / keyboard

### Keyboard resizes the visual viewport (iOS especially)
- **Symptom:** Tab bar, sheet footers, or “Done” sit under the keyboard or float in the wrong place; focused inputs are obscured.
- **Cause:** Mobile Safari / standalone PWA shrinks `visualViewport` when the keyboard opens; `100vh` / `fixed` bottom UI does not follow.
- **Rule:** Size overlays with **`visualViewport`** (see `FullScreenSheet`). Keep tab-bar clearance via `--viewport-bottom-inset` (`SafeAreaInsets`). Prefer `dvh` over raw `100vh` for full-height shells. Never assume `window.innerHeight ===` visible height while typing.

### Full-screen sheets must lock chrome
- **Symptom:** Background scrolls, tab bar peeks through sheets, double scroll traps.
- **Cause:** Sheet open without `lockFullScreenChrome` / missing unlock on close.
- **Rule:** Always use `FullScreenSheet` (or the same lock/unlock pair). Tests must call `resetFullScreenChromeForTests` in `afterEach`.

### Sheet effect deps stealing focus
- **Symptom:** Search / inputs lose focus every keystroke; keyboard flickers closed.
- **Cause:** `useEffect(..., [open, onClose, ...])` re-runs when parent re-creates callbacks; focus reset runs again.
- **Rule:** Focus-trap / initial-focus effects must depend on **`open` (and stable refs) only** — not `onClose` identity. Fixed in v3.2.2 for sheets/dialogs; do not regress.

### Service worker in local dev
- **Symptom:** After killing `npm run start`, the installed SW serves `offline.html` (“no internet”) instead of Next.
- **Cause:** SW registered in development / localhost.
- **Rule:** Do not register the SW in non-production; unregister on localhost (`ServiceWorkerUpdate`). Test PWA behavior in a production build or deployed preview.

### Share / download on iOS PWA
- **Symptom:** Share flickers or does nothing; or the app navigates away and dies on a blob URL.
- **Cause:** `<a download>` + data URLs ignored; `location.assign(blobUrl)` leaves the document.
- **Rule:** Prefer `navigator.share({ files })`, then blob download, then `window.open` preview. **Never** navigate the current document to a blob URL.

---

## Exercise identity / analytics

### Catalog twins look the same, filter by id
- **Symptom:** Tracked “Running” / “Treadmill Run” but PRs empty; history used `Treadmill` / `Jogging` / `Walking`.
- **Cause:** Separate catalog ids; display layer turns “Treadmill Run” into Run + Treadmill chip.
- **Rule:** Use `exerciseIdentity` aliases (run/jog, walk/walking, treadmill ↔ treadmill run). Do **not** merge run↔walk or barbell↔Smith. Prefer logged-first My exercises; show “Not in your history” there — not amber banners on PRs.

### My exercises ≠ Strength/Cardio filter
- **Symptom:** Agent or UI “hides” lifts from Strength because they’re not tracked.
- **Cause:** Misreading product intent.
- **Rule:** `trackedExercises` shortens **PRs only**. Documented in tips + product docs.

### PRs tied to chart period (loading bug)
- **Symptom:** PRs only show recent month until user picks Year/All.
- **Cause:** Default period fetch seeded `lifetimeDays`; PRs computed before lifetime backfill.
- **Rule:** PRs always all-time; load lifetime history independently; hide period chips on PRs tab; don’t show empty “No PRs” while `lifetimeLoading`.

### Identity only on `findAllPRs` (known gap)
- **Symptom:** Strength expand / lift progress still splits the same movement under different keys.
- **Cause:** Some analytics paths still use `exerciseId || name` without `resolveExerciseKey`.
- **Rule:** When touching Strength trends, wire the same identity helper — or document the gap explicitly in the PR.

---

## Auth / emulators / data

### Production accounts don’t exist on Auth emulator
- **Symptom:** `auth/user-not-found` locally with a real email.
- **Cause:** Emulator Auth is empty / separate from production.
- **Rule:** Sign **up** locally. Friendly copy via `authErrors`. Yellow emulator banner = expected.

### Local calendar dates, not UTC
- **Symptom:** Off-by-one day / streak bugs.
- **Cause:** `toISOString().slice(0,10)` or UTC midnight.
- **Rule:** Day ids and `date` fields use **local** `YYYY-MM-DD` (`normalizeDateToYYYYMMDD`).

### Legacy `workouts` collection
- **Symptom:** Writing new analytics against `workouts`.
- **Rule:** Source of truth is `days`. Do not write `workouts`.

---

## UI / UX (navigation & composition)

### Secondary metrics must not share one date
- **Symptom:** Cardio PR row shows pace + distance with a single timestamp; looks like both happened the same day.
- **Cause:** Bolting a second value onto the primary PR row instead of its own metric + day link.
- **Rule:** Each measurable best gets its own label, value, and date (or day deep-link). Prefer “Fastest pace” / “Longest distance” over generic “Best …”.

### Peer stats must look like peers
- **Symptom:** One profile stat chip (e.g. volume) looks “special” and the others look like editable fields.
- **Cause:** Accent / brand fill on one of N equal ledger facts.
- **Rule:** Same visual treatment for peer readouts. Accent is for hierarchy or CTAs, not one arbitrary number in a set.

### Tab bar covering page content
- **Symptom:** Last rows on Friends (or other scroll pages) sit under / flush with the bottom tab bar.
- **Cause:** Shell bottom inset matched nav height exactly while the tab bar also has a brand stripe / safe-area padding; scroll regions with no end padding look clipped.
- **Rule:** `.app-shell` must pad below the tab bar (`--app-nav-height` + `--safe-area-bottom` + a small buffer). Scrollable `main` content needs end padding (`pb-8` or similar). On pre-release, scroll every new/changed app page to the bottom on a phone-width viewport and confirm nothing is under the tab bar.

### Nested destinations need a home tab + a way back
- **Symptom:** Friends opened from Profile but Profile tab is inactive; no back control; Profile also links to Leaderboards that Friends already contains.
- **Cause:** Leaving social routes outside the Profile route tree; duplicating child destinations on the parent.
- **Rule:** Friends + leaderboards live under `/profile/friends…` so the Profile tab stays current. Parent links once to the hub; children link deeper. Every nested page has an explicit back target (not only `router.back()`).

### One place to edit public identity
- **Symptom:** Username/photo editors on both Profile and Account.
- **Cause:** Copying Account into Profile without retiring the duplicate.
- **Rule:** Photo + username edit on **Profile** only. Settings → Sign-in is email / login context and a link to Profile.

---

## How to extend this file

1. Reproduce once → write **Symptom / Cause / Rule** (3–6 lines).
2. Link the owning module if useful.
3. If it changes product rules, also update `docs/product.md` or `BACKLOG.md` non-goals.
4. Mention it in the next release notes if users saw it.
