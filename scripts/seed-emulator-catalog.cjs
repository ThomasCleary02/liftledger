const admin = require("firebase-admin");

const HOST = "127.0.0.1:8080";
const PROJECT = "demo-liftledger";

const exercises = [
  { id: "barbell_bench_press", name: "Barbell Bench Press", muscleGroup: "chest", modality: "strength" },
  { id: "barbell_squat", name: "Barbell Squat", muscleGroup: "legs", modality: "strength" },
  { id: "barbell_deadlift", name: "Barbell Deadlift", muscleGroup: "back", modality: "strength" },
  { id: "overhead_press", name: "Overhead Press", muscleGroup: "shoulders", modality: "strength" },
  { id: "barbell_row", name: "Barbell Row", muscleGroup: "back", modality: "strength" },
  { id: "running", name: "Running", muscleGroup: "full_body", modality: "cardio" },
  { id: "rowing", name: "Rowing", muscleGroup: "full_body", modality: "cardio" },
  { id: "pull_up", name: "Pull-Up", muscleGroup: "back", modality: "calisthenics" },
  { id: "push_up", name: "Push-Up", muscleGroup: "chest", modality: "calisthenics" },
  { id: "plank", name: "Plank", muscleGroup: "abs", modality: "calisthenics" },
];

function foldName(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  process.env.FIRESTORE_EMULATOR_HOST = HOST;
  process.env.GCLOUD_PROJECT = PROJECT;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT });
  }

  const db = admin.firestore();
  const existing = await db.collection("exercises").limit(1).get();
  if (!existing.empty) {
    console.log("[seed] emulator catalog already present, skipping");
    return;
  }

  const batch = db.batch();
  for (const exercise of exercises) {
    batch.set(db.collection("exercises").doc(exercise.id), {
      ...exercise,
      nameFolded: foldName(exercise.name),
    });
  }
  await batch.commit();
  console.log(`[seed] wrote ${exercises.length} exercises to the Firestore emulator`);
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
