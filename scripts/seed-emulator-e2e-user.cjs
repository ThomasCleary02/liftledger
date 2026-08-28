const admin = require("firebase-admin");

const PROJECT = "demo-liftledger";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const EMAIL = process.env.E2E_EMAIL || "e2e@liftledger.test";
const PASSWORD = process.env.E2E_PASSWORD || "e2e-password-1";
const USERNAME = "e2euser";
const PRIOR_DATE = "2017-04-01";

async function main() {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
  process.env.GCLOUD_PROJECT = PROJECT;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT });
  }

  const auth = admin.auth();
  let user;
  try {
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      emailVerified: true,
    });
    console.log(`[seed] created e2e auth user ${EMAIL}`);
  } catch (error) {
    if (error?.code !== "auth/email-already-exists") throw error;
    user = await auth.getUserByEmail(EMAIL);
    console.log(`[seed] e2e auth user ${EMAIL} already exists`);
  }

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  await db.collection("accounts").doc(user.uid).set(
    {
      email: EMAIL.toLowerCase(),
      username: USERNAME,
    },
    { merge: true },
  );
  await db.collection("usernameIndex").doc(USERNAME).set(
    { userId: user.uid },
    { merge: true },
  );
  await db.collection("emailIndex").doc(EMAIL.toLowerCase()).set(
    { userId: user.uid },
    { merge: true },
  );

  const dayId = `${user.uid}_${PRIOR_DATE}`;
  await db.collection("days").doc(dayId).set(
    {
      userId: user.uid,
      date: PRIOR_DATE,
      isRestDay: false,
      exercises: [
        {
          exerciseId: "face_pull",
          name: "Face Pull",
          modality: "strength",
          strengthSets: [{ reps: 12, weight: 30 }],
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  console.log(`[seed] e2e user ready (${user.uid})`);
}

main().catch((error) => {
  console.error("[seed] e2e user failed", error);
  process.exit(1);
});
