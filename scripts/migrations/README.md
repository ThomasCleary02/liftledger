# Historical migrations

These scripts already ran against production. They are kept as a record, not as a regular toolchain.

| Script | What it did |
|---|---|
| `001-initial-exercises.ts` | Seeded the global `exercises` catalog. The old `exercises.json` payload is no longer in the repo. |
| `002-workouts-to-days.ts` | Copied legacy `workouts` into `days/{userId}_{date}` using the client SDK. Idempotent; never deleted workouts. |
| `002-workouts-to-days-admin.ts` | Same copy using the Admin SDK (bypasses security rules). |
| `run-migration.ts` | Wrapper around `002`. Supports `--dry-run` and `--rollback` (rollback deletes **all** `days` docs). |

Do not run `--rollback` or a fresh seed against `lift-ledger-8f627` unless you have a backup and a reason. New exercise rows belong in the admin UI or a new, explicit seed — not a silent re-run of `001`.
