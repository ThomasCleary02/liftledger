# Data model

Firebase project: `lift-ledger-8f627`. Auth: email/password. Database: Firestore. Files: Storage (avatars).

## Collections

| Collection | Role |
|---|---|
| `days/{userId}_{YYYY-MM-DD}` | Workouts and rest days (local calendar date) |
| `workoutTemplates` | User templates |
| `exercises` | Global catalog (public read) |
| `accounts` | Profile, username, favorites, **trackedExercises**, prefs-ish fields, achievement progress |
| `emailIndex` | Friend lookup by email |
| `usernameIndex` | Friend lookup by username (first-claim) |
| `friends` | Bidirectional friendship |
| `friendRequests` | Pending / accepted / rejected |
| `workouts` | **Legacy.** Do not write. Analytics read `days` only. |

### Security notes

- `emailIndex/{email}` writable only when the doc id matches the signed-in user’s auth email.
- `usernameIndex/{username}` is first-claim; update/delete require ownership.
- Admin exercise mutations gated by configured admin emails.

## Day document (conceptually)

- `userId`, `date` (`YYYY-MM-DD` local), `isRestDay`, `exercises[]`, optional `notes`, `status` (`injured`), `importId`, `bodyweightLbs`, timestamps.
- Each exercise may include `exerciseId` (catalog id), `name`, `modality` (`strength` | `cardio` | `calisthenics`), and modality payloads (`strengthSets`, `cardioData`, `calisthenicsSets`).
- Legacy rows sometimes omit modality; readers recover cardio/calisthenics from payloads (`normalizeExercise` / PR modality resolution).

## Units

- Stored: **pounds**, **miles**, durations in seconds, pace as seconds per mile when present.
- Display conversion happens at the UI edge via shared unit helpers.

## Exercise identity

Canonical helpers: `packages/shared/exerciseIdentity.ts`.

- Fold names for matching (trim, lower, collapse `_` / `-` / spaces).
- Alias groups (same PR / tracking identity):
  - run ↔ running ↔ jog ↔ jogging
  - walk ↔ walking
  - treadmill ↔ treadmill run
- **Not** aliased: run ↔ walk; barbell ↔ Smith ↔ machine.
- `resolveExerciseKey` prefers catalog ids so name-only legacy logs still match My exercises.
- Account `trackedExercises` filters **PRs only** via allow-list expansion (aliases included). Empty list → show all PRs.

## Related

- Product rules: [Product](./product.md)
- Where code lives: [Architecture](./architecture.md)
- Rules deploy: [Hosting](./hosting.md)
