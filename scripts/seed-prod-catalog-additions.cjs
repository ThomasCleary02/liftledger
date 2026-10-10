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
const { PROJECT, getProdFirestore, foldName, slugify } = require("./prod-firestore.cjs");

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.slice(2).find((a) => a !== "--dry-run");
const additionsFile = fileArg || "catalog-additions-3.3.4.json";
const additionsPath = path.isAbsolute(additionsFile)
  ? additionsFile
  : path.join(__dirname, additionsFile);

async function main() {
  const db = getProdFirestore("seed-prod");

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
