import { connectAuthEmulator, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

export const DEMO_PROJECT_ID = "demo-liftledger";

export const EMULATOR_HOST = "127.0.0.1";

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  ui: 4000,
} as const;

export const EMULATOR_UI_URL = `http://${EMULATOR_HOST}:${EMULATOR_PORTS.ui}`;

const connectedKey = "__liftledgerEmulatorsConnected";

type EmulatorGlobal = typeof globalThis & { [connectedKey]?: boolean };

/**
 * Local `next dev` talks to the emulator suite, not production.
 * Set NEXT_PUBLIC_USE_PRODUCTION=true to opt back into the live project.
 */
export function shouldUseFirebaseEmulators(
  nodeEnv = process.env.NODE_ENV,
  useProduction = process.env.NEXT_PUBLIC_USE_PRODUCTION,
): boolean {
  return nodeEnv === "development" && useProduction !== "true";
}

export const emulatorFirebaseConfig = {
  apiKey: "demo-liftledger",
  authDomain: "demo-liftledger.firebaseapp.com",
  projectId: DEMO_PROJECT_ID,
  storageBucket: "demo-liftledger.appspot.com",
  messagingSenderId: "0",
  appId: "demo-liftledger",
};

export function connectFirebaseEmulators(
  auth: Auth,
  db: Firestore,
  storage: FirebaseStorage,
): void {
  const g = globalThis as EmulatorGlobal;
  if (g[connectedKey]) return;

  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage);
  g[connectedKey] = true;
}
