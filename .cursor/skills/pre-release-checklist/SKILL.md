---
name: pre-release-checklist
description: >-
  Run LiftLedger pre-release audits (theme/dark mode, UI/UX, consistency,
  code quality, PWA/keyboard pitfalls, tests) and report ship-ready vs blockers.
  Use when the user asks for a pre-release checklist, release audit, ship check,
  or "are we ready to release".
---

# Pre-release checklist

Run this **before** version bump / tag. Do not commit or release unless the user asks after the report.

## 0. Orient

Read (skimming is fine if already in context):

- `docs/README.md`
- `docs/product.md` (non-goals)
- `docs/pitfalls.md` (**required** — PWA keyboard, identity, SW, share)
- `BACKLOG.md` (only to avoid shipping the wrong thing)
- `git log -8 --oneline` and `git status` / diff vs last tag

Scope = **uncommitted + commits since last release tag**, not the whole app history, unless the user asks for a full audit.

## 1. Automated gates

From repo root (PowerShell-safe; quote paths with `()`):

1. `npm test` (workspaces + Firestore rules) — or at least shared + web unit tests if rules are slow and user agrees
2. `npm run type-check`
3. Note whether e2e should run: if auth/day/analytics/share/settings touched → recommend `npm run test:e2e`

Record pass/fail. Failures are **P0** unless clearly unrelated flake.

## 2. Audit passes (parallel explore or direct reads)

Produce findings as **P0 / P1 / P2** with file paths. Cover:

### Theme / dark mode
- New UI uses remapped utilities (`bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-100|200|300`) or intentional brand tokens
- Avoid one-off amber/pink warning cards on Analytics unless dark-remapped
- Check sheets opened by the change (`FullScreenSheet` family)

### UI / UX
- Empty vs loading races (never show “empty” while still loading)
- Copy matches product rules (My exercises = PRs only; PRs = all time)
- Mobile: Share, sheets, keyboard — cross-check `docs/pitfalls.md`
- Settings / My exercises deep-link expectations if Analytics points at Settings
- **Composition (from `docs/pitfalls.md` UI/UX):** secondary metrics each have their own date; peer stats share one visual language; nested routes under a tab keep that tab active + have an explicit back; no duplicate editors for the same identity fields; don’t link a parent to a child destination that already lives on the hub page you just linked
- **Tab bar clearance:** on phone width, scroll every changed app page to the bottom — last content must clear the fixed tab bar (see pitfalls)

### Consistency
- Favorites vs My exercises patterns (acceptable drift OK; call out ugly mismatches)
- Tips (`web/lib/tips.ts`) still true after the change
- Version strings only if this is already a release bump

### Code quality
- Unused imports / dead orphan UX duplication
- Effect deps on sheets (`open` only for focus)
- Identity: new PR/filter paths must use `exerciseIdentity` helpers
- No `location.assign` to blob URLs; no SW register in dev

### PWA / keyboard spot-check
Explicitly answer:
- Any new `fixed` bottom UI or `100vh` without viewport handling?
- Any new sheet with unstable effect deps?
- Any download/share path that navigates the document?
- Any changed scroll page whose last content sits under the tab bar on phone width?

## 3. Report format

```markdown
## Pre-release verdict: ship-ready | not ship-ready

### Automated
- tests: …
- typecheck: …
- e2e: ran / skipped (why)

### P0 (block release)
- …

### P1 (should fix soon / same release if touching that area)
- …

### P2 (polish)
- …

### Pitfalls checked
- keyboard/viewport: …
- identity/PRs: …
- SW/share: …
- UI composition (dates / peer stats / nested nav / identity editors): …
- tab bar clearance (scroll to bottom on phone width): …

### Suggested next step
- fix P0s / bump to vX.Y.Z / commit only / etc. (do not do it unless asked)
```

## 4. Do not

- Do not bump version, tag, push, or `gh release` inside this skill unless the user explicitly asks after the report
- Do not expand scope into backlog feature work
- Do not “fix” P2 drive-by refactors while auditing
