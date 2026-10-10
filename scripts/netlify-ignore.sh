#!/usr/bin/env bash
# Netlify ignore command: exit 0 = skip build, non-zero = build.
# Skip only when we can prove no package.json changed since the last built commit.
# Without a build cache Netlify sets CACHED_COMMIT_REF to COMMIT_REF, which made a
# plain `git diff` report "no changes" and cancel v3.3.4 — so default to building.
base="${CACHED_COMMIT_REF:-}"
if [ -z "$base" ] || [ "$base" = "$COMMIT_REF" ]; then
  echo "[ignore] no previous build to compare against; building"
  exit 1
fi
if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "[ignore] $base not in clone; building"
  exit 1
fi
if git diff --quiet "$base" "$COMMIT_REF" -- package.json web/package.json packages/*/package.json; then
  echo "[ignore] no package.json changes since $base; skipping build"
  exit 0
fi
echo "[ignore] package.json changed since $base; building"
exit 1
