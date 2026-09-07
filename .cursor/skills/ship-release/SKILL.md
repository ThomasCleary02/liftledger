---
name: ship-release
description: >-
  Bump LiftLedger patch/minor version, commit pending release work, tag vX.Y.Z,
  push, and create a GitHub release. Use only when the user explicitly asks to
  release, ship, or tag after a pre-release checklist passes.
---

# Ship release

**Only run when the user explicitly asks to release/ship/tag.** Prefer they already ran `pre-release-checklist`. If not, warn and offer to run it first.

## Steps

1. `git status` / `git log -5` / latest tag (`git tag --sort=-v:refname`).
2. Confirm working tree is the intended release (docs + fixes). No `.env` / service-account / `emulator-data`.
3. Choose next semver (default patch: `3.2.3` → `3.2.4` unless user specifies).
4. Bump version in:
   - `package.json`
   - `packages/shared/package.json`
   - `web/package.json`
   - `package-lock.json` workspace entries (root + `packages/shared` + `web` only)
   - Settings footer `LiftLedger vX.Y.Z` in `web/app/(app)/settings/page.tsx`
5. Commit with style matching recent tags (short why + `for vX.Y.Z`). Include Co-authored-by only if prior releases did.
6. `git tag -a vX.Y.Z -m "vX.Y.Z"`
7. `git push origin HEAD` and `git push origin vX.Y.Z`
8. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."` (bullet summary)
9. Show commit hash + release URL.

## Do not

- Force-push
- Skip hooks (`--no-verify`) unless user insists
- Amend unless user rules allow
- Include unrelated dirty files
