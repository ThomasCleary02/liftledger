import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { createWorkoutService } from "@liftledger/shared/firestore/workouts";
import { createExerciseService } from "@liftledger/shared/firestore/exercises";
import { createAccountService } from "@liftledger/shared/firestore/account";
import { createWorkoutTemplateService } from "@liftledger/shared/firestore/workoutTemplates";
import { logger } from "./logger";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: "lift-ledger-8f627",
  storageBucket: "lift-ledger-8f627.firebasestorage.app",
  messagingSenderId: "638321739341",
  appId: "1:638321739341:web:b3c4b8cf287dec4e907e04",
  measurementId: "G-M04D4MX5J7"
};

// Validate required environment variables
function validateConfig() {
  const required = ["apiKey", "authDomain"] as const;
  const missing: string[] = [];
  
  required.forEach((key) => {
    if (!firebaseConfig[key]) {
      missing.push(`NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);
    }
  });

  if (missing.length > 0) {
    const errorMsg = `Firebase configuration is missing: ${missing.join(", ")}. Please set these in .env.local`;
    logger.error(errorMsg);
    
    if (typeof window !== "undefined") {
      throw new Error(errorMsg);
    }
  }
}

// Only validate on client side
if (typeof window !== "undefined") {
  validateConfig();
}

let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;
let auth: ReturnType<typeof getAuth>;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Set persistence to localStorage (persists across browser sessions)
  // This ensures users stay logged in even after closing the browser
  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      logger.error("Failed to set auth persistence", error);
    });
  }
} catch (error) {
  logger.error("Failed to initialize Firebase", error);
  throw error;
}

// Create service instances
export { db, auth };
export const workoutService = createWorkoutService(db, auth);
export const exerciseService = createExerciseService(db);
export const accountService = createAccountService(db, auth);
export const workoutTemplateService = createWorkoutTemplateService(db, auth);
