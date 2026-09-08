# Hosting

## Web (PWA)

- Host: **Netlify**
- Config: root [`netlify.toml`](../netlify.toml)
  - Build: `npm test && npm run build:web`
  - Publish: `web/.next`
  - Node 22
  - Plugin: `@netlify/plugin-nextjs`
  - **Ignore rule**: only builds when `package.json` changes (version bumps control deploys)
- **Do not** set the Netlify base directory to `web/` — monorepo root is canonical.

### Required Netlify env

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_BASE_URL` (canonical site URL)

Other Firebase public config keys as used by `web/lib/firebase.ts` / `.env.example`.

## Firebase

Project id: `lift-ledger-8f627`

```bash
npx firebase login
npm run deploy:firestore:rules
npm run deploy:firestore:indexes
npm run deploy:firestore          # rules + indexes
npm run deploy:storage:rules
```

Rules apply immediately. Composite indexes may stay in “Building” for a few minutes after deploy.

## Release habit

1. Land work on `main` with tests green.
2. Bump `3.x.y` in root / shared / web package.json (+ lockfile workspace entries + Settings footer).
3. Tag `v3.x.y`, push commit + tag.
4. Optional: `gh release create` with short notes.
5. Netlify builds from `main`; deploy Firebase rules/indexes when they change.

## Related

- Local emulators: [Development](./development.md)
- Collections / rules intent: [Data model](./data-model.md)
