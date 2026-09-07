# Agent workflow

How this repo is set up for Cursor agents. Keep this short; deep product rules live elsewhere.

## Primitives

| Kind | Path | When it loads |
|---|---|---|
| Always-on rule | `.cursor/rules/liftledger.mdc` | Every chat (keep tiny) |
| Path rules | `.cursor/rules/pwa-sheets.mdc`, `exercise-identity.mdc` | When matching files are in context |
| Skill | `.cursor/skills/pre-release-checklist/` | `/pre-release-checklist` or when asking for a release audit |
| Command | `.cursor/commands/pre-release.md` | `/pre-release` (thin wrapper → skill) |
| Hook | `.cursor/hooks.json` + `hooks/block-secret-paths.cjs` | Blocks `git add/commit` of `.env*`, service-account JSON, `emulator-data/` |
| Docs map | `docs/README.md` | Durable knowledge |
| Pitfalls | `docs/pitfalls.md` | Recurring bugs (PWA keyboard, identity, SW) |
| Brief | `AGENTS.md` | LLM entry |
| Backlog | `BACKLOG.md` | What to ship next only |

`.cursorignore` keeps bulky trees out of the index (`node_modules`, `.next`, emulator data, Playwright artifacts). It does **not** replace `.gitignore`.

## Efficient loops

1. **Feature work** — agent reads `docs/product.md` + pitfalls if touching sheets/PRs; path rules fire automatically.
2. **Pre-release** — `/pre-release` → fix P0s → ask to commit/release.
3. **Release** — only when asked: bump versions, tag, push (see `docs/hosting.md`).
4. **New footgun** — add a 3-line entry to `docs/pitfalls.md` (symptom / cause / rule). UI composition footguns (nested nav, duplicate editors, bolted secondary metrics) belong there too so `/pre-release` catches them.

## Do not

- Put long essays in always-apply rules (taxes every prompt).
- Commit secrets; the hook is a seatbelt, not a substitute for review.
- Ignore `.cursor/skills|commands|rules|hooks` again in `.gitignore`.

## Related

- [Development](./development.md)
- [Pitfalls](./pitfalls.md)
- [Hosting](./hosting.md)
