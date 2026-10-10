/**
 * Upsert catalog additions into production Firestore.
 * Auth: Firebase CLI login (npx firebase login) via refresh token.
 * Merge-only; does not wipe the catalog.
 *
 *   npx firebase use lift-ledger-8f627
 *   node scripts/seed-prod-catalog-additions.cjs
 *   node scripts/seed-prod-catalog-additions.cjs --dry-run
 *   node scripts/seed-prod-catalog-additions.cjs catalog-additions-3.3.3.json
 *   node scripts/seed-prod-catalog-additions.cjs catalog-additions-3.3.3.json --dry-run
 */
const fs = require("node:fs");
const path = require("node:path");
const { Firestore } = require("@google-cloud/firestore");
const { UserRefreshClient } = require("google-auth-library");
const { getGlobalDefaultAccount } = require("firebase-tools/lib/auth");
const firebaseApi = require("firebase-tools/lib/api");

const PROJECT = "lift-ledger-8f627";
const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.slice(2).find((a) => a !== "--dry-run");
const additionsFile = fileArg || "catalog-additions-3.3.4.json";
const additionsPath = path.isAbsolute(additionsFile)
  ? additionsFile
  : path.join(__dirname, additionsFile);

function foldName(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

async function main() {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

  const account = getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) {
    console.error("[seed-prod] Firebase CLI is not logged in. Run: npx firebase login");
    process.exit(1);
  }
  console.log(`[seed-prod] using Firebase CLI account ${account.user?.email || "(unknown)"}`);

  const authClient = new UserRefreshClient({
    clientId: firebaseApi.clientId(),
    clientSecret: firebaseApi.clientSecret(),
    refreshToken: account.tokens.refresh_token,
  });

  const db = new Firestore({
    projectId: PROJECT,
    authClient,
  });

  const additions = JSON.parse(fs.readFileSync(additionsPath, "utf8"));
  console.log(
    `[seed-prod] project=${PROJECT} file=${path.basename(additionsPath)} dryRun=${dryRun} count=${additions.length}`
  );

  let written = 0;
  for (const exercise of additions) {
    const id = slugify(exercise.name);
    const payload = {
      id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      modality: exercise.modality,
      nameFolded: foldName(exercise.name),
    };
    const ref = db.collection("exercises").doc(id);
    const existing = await ref.get();
    const action = existing.exists ? "update" : "create";
    console.log(`  ${action} ${id}`);
    if (!dryRun) {
      await ref.set(payload, { merge: true });
      written += 1;
    }
  }

  console.log(
    dryRun
      ? `[seed-prod] dry-run complete (${additions.length} would upsert)`
      : `[seed-prod] upserted ${written} exercises`
  );
}

main().catch((error) => {
  console.error("[seed-prod] failed", error.message || error);
  process.exit(1);
});
