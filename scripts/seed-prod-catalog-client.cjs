/**
 * Upsert catalog additions into production using the client SDK.
 * No Netlify redeploy. Uses Firestore rules (admin email write).
 *
 * From repo root (PowerShell):
 *   $env:NEXT_PUBLIC_FIREBASE_API_KEY="..."   # from Netlify env UI — view only
 *   $env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="lift-ledger-8f627.firebaseapp.com"
 *   $env:SEED_EMAIL="thomcleary15@gmail.com"
 *   $env:SEED_PASSWORD="..."
 *   node scripts/seed-prod-catalog-client.cjs
 *   node scripts/seed-prod-catalog-client.cjs catalog-additions-3.3.3.json
 *
 * Optional: --dry-run
 */
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, getDoc } = require("firebase/firestore");
const fs = require("node:fs");
const path = require("node:path");

const dryRun = process.argv.includes("--dry-run");
const PROJECT = "lift-ledger-8f627";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${PROJECT}.firebaseapp.com`;
const email = (process.env.SEED_EMAIL || "thomcleary15@gmail.com").trim();
const password = process.env.SEED_PASSWORD || "";

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

  if (!apiKey) {
    console.error("Set NEXT_PUBLIC_FIREBASE_API_KEY (copy from Netlify env — no redeploy).");
    process.exit(1);
  }
  if (!password) {
    console.error("Set SEED_PASSWORD for the admin account.");
    process.exit(1);
  }

  const additions = JSON.parse(fs.readFileSync(additionsPath, "utf8"));
  const app = initializeApp({
    apiKey,
    authDomain,
    projectId: PROJECT,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`[seed-client] signing in as ${email}…`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log(
    `[seed-client] file=${path.basename(additionsPath)} dryRun=${dryRun} count=${additions.length}`
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
    const ref = doc(db, "exercises", id);
    const existing = await getDoc(ref);
    const action = existing.exists() ? "update" : "create";
    console.log(`  ${action} ${id}`);
    if (!dryRun) {
      await setDoc(ref, payload, { merge: true });
      written += 1;
    }
  }

  console.log(
    dryRun
      ? `[seed-client] dry-run complete`
      : `[seed-client] upserted ${written} exercises`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("[seed-client] failed", error.code || error.message || error);
  process.exit(1);
});
