const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1:8080";
const PROJECT = "demo-liftledger";
const catalogPath = path.join(__dirname, "emulator-catalog.json");

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
  process.env.FIRESTORE_EMULATOR_HOST = HOST;
  process.env.GCLOUD_PROJECT = PROJECT;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT });
  }

  const exercises = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const db = admin.firestore();
  const BATCH_LIMIT = 400;
  let written = 0;

  for (let i = 0; i < exercises.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const slice = exercises.slice(i, i + BATCH_LIMIT);
    for (const exercise of slice) {
      const id = exercise.id || slugify(exercise.name);
      batch.set(
        db.collection("exercises").doc(id),
        {
          id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          modality: exercise.modality,
          nameFolded: foldName(exercise.name),
        },
        { merge: true },
      );
      written += 1;
    }
    await batch.commit();
  }

  console.log(`[seed] upserted ${written} exercises into the Firestore emulator`);
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
