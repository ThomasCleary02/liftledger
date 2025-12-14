# Migration Guide

## Migration 002: Workouts to Days

This migration converts the existing `workouts` collection to the new `days` collection structure for **ALL users**.

### Safety Guarantees

- **Read-only access**: The migration only READS from the `workouts` collection. It never deletes or updates existing workouts.
- **Idempotent**: Safe to run multiple times. If a day already exists for a date, it will be skipped.
- **Non-destructive**: Original workout data remains completely untouched.
- **All users**: Migrates data for all users in a single run.

### How It Works

1. Reads **all workouts** from Firestore (all users)
2. Groups workouts by userId and date (normalized to YYYY-MM-DD using local timezone)
3. For each unique user-date combination:
   - Checks if a day already exists (idempotency)
   - Merges all exercises from workouts on that date
   - Creates a day document with `dayId = ${userId}_${YYYY-MM-DD}`
   - Sets `isRestDay = false` (default)

### Running the Migration

#### Prerequisites

- Node.js environment with TypeScript support
- Firebase configuration (API key and auth domain)
- **Option A**: Firebase Admin SDK (recommended for production)
- **Option B**: Firestore rules that allow reading all workouts (for development)

#### Option A: Using Client SDK (Simple, but requires rule changes)

**Note**: This requires Firestore rules that allow reading all workouts. You may need to temporarily adjust your rules.

1. Set environment variables:
   ```bash
   export NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   ```

2. Dry run (recommended first):
   ```bash
   npx tsx scripts/migrations/run-migration.ts --dry-run
   ```

3. Execute migration:
   ```bash
   npx tsx scripts/migrations/run-migration.ts
   ```

#### Option B: Using Admin SDK (Recommended for Production)

**This bypasses Firestore security rules and is the recommended approach.**

1. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Set up service account:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Save it as `service-account-key.json` in the project root (add to .gitignore!)
   - Set environment variable:
     
     **PowerShell (Windows):**
     ```powershell
     $env:GOOGLE_APPLICATION_CREDENTIALS = ".\service-account-key.json"
     ```
     
     **Bash/Linux/Mac:**
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
     ```

3. Dry run:
   ```bash
   npx tsx scripts/migrations/002-workouts-to-days-admin.ts --dry-run
   ```

4. Execute migration:
   ```bash
   npx tsx scripts/migrations/002-workouts-to-days-admin.ts
   ```

### Expected Output

```
============================================================
Migration: Workouts to Days migration (All Users)
Dry run: NO
============================================================
Reading all workouts from Firestore (all users)...
Found 150 workouts across all users
Found 2 user(s) with workouts
Grouped into 45 unique user-date combinations

Processing user: user123
  25 unique dates
  [CREATED] Day for 2025-01-15 (3 exercises from 1 workout(s))
  [CREATED] Day for 2025-01-16 (5 exercises from 2 workout(s))
  [SKIP] Day for 2025-01-17 already exists
...

Processing user: user456
  20 unique dates
  [CREATED] Day for 2025-01-10 (2 exercises from 1 workout(s))
  ...
============================================================
Migration Summary:
  Total workouts processed: 150
  Users processed: 2
  Days created: 44
  Days skipped (already exist): 1
  Errors: 0
============================================================

Migration completed successfully!
CRITICAL: Original workouts remain untouched (read-only migration).
```

### Rollback

If you need to rollback (delete all days):

**Client SDK version:**
```bash
npx tsx scripts/migrations/run-migration.ts --rollback
```

**Admin SDK version:**
```bash
# You'll need to manually delete days or use Firestore console
# The admin script doesn't have rollback yet
```

**Note**: Rollback only deletes days. Original workouts remain untouched.

### Edge Cases Handled

- **Multiple workouts on same day**: Exercises are merged into a single day document
- **Workouts with no date**: Uses `createdAt` timestamp (normalized to local timezone)
- **Existing days**: Skipped (idempotency)
- **Missing userId**: Error logged, skipped
- **Multiple users**: All users processed in a single run

### Date Normalization

**CRITICAL**: Dates are normalized using the user's **local timezone**, NOT UTC. This prevents off-by-one streak bugs.

- Uses `date-fns` `format()` function (local timezone)
- NOT `toISOString()` (which uses UTC)
- Format: `YYYY-MM-DD` (e.g., `2025-01-15`)

### Firestore Security Rules

**If using Client SDK**, you may need to temporarily adjust your Firestore rules to allow reading all workouts:

```javascript
// Temporary rule for migration (REMOVE AFTER MIGRATION!)
match /workouts/{workoutId} {
  allow read: if true; // Temporarily allow reading all workouts
  allow write: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.ownerId == request.auth.uid;
}

// Days collection - users can read/write their own days
match /days/{dayId} {
  allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}
```

**If using Admin SDK**, no rule changes needed - Admin SDK bypasses security rules.

### Verification

After migration, verify:

1. Check days collection in Firestore console
2. Verify day count matches unique workout dates per user
3. Verify exercises are correctly merged
4. Test day queries in the app for both users

### Troubleshooting

**Error: "Permission denied"**
- If using Client SDK: Check Firestore security rules
- Consider using Admin SDK instead

**Error: "Day for X already exists"**
- This is expected if you re-run the migration (idempotency)
- The day will be skipped

**Missing exercises**
- Check that workouts have exercises array
- Verify exercise normalization logic

**Only one user's data migrated**
- Make sure you're using the version that reads all workouts
- Check that Firestore rules allow reading all workouts (or use Admin SDK)

### Post-Migration

After successful migration:

1. The app can start using the `days` collection
2. Old `workouts` collection remains for reference
3. Eventually, workouts can be deprecated (separate task)
4. **Restore Firestore rules** if you temporarily changed them

### Questions?

If you encounter issues:
1. Check the migration logs
2. Verify Firestore permissions/rules
3. Ensure date normalization is correct (local timezone)
4. Review the migration script for details
5. Consider using Admin SDK if rules are too restrictive
