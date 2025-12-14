/**
 * Migration Runner
 * 
 * This script runs the workouts-to-days migration for ALL users.
 * 
 * Usage:
 *   npx tsx scripts/migrations/run-migration.ts [--dry-run]
 * 
 * Environment Variables (set in .env.local or .env):
 *   - NEXT_PUBLIC_FIREBASE_API_KEY (or EXPO_PUBLIC_FIREBASE_API_KEY)
 *   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (or EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN)
 * 
 * Note: This script reads ALL workouts from Firestore and migrates them to days.
 * It bypasses user authentication to process all users at once.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { migration } from "./002-workouts-to-days";
import * as readline from "readline";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rollback = args.includes("--rollback");

// Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: "lift-ledger-8f627",
  storageBucket: "lift-ledger-8f627.firebasestorage.app",
  messagingSenderId: "638321739341",
  appId: "1:638321739341:web:b3c4b8cf287dec4e907e04",
  measurementId: "G-M04D4MX5J7"
};

// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error("❌ Error: Firebase configuration is missing!");
  console.error("Please set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  console.error("in a .env.local file or as environment variables.");
  process.exit(1);
}

async function runMigration() {
  try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Create a mock auth object (we don't actually need a user for this migration
    // since we're reading/writing directly to Firestore)
    const mockAuth = {
      currentUser: null, // Not needed since we bypass service layer
    };

    console.log("Firebase initialized successfully");
    console.log("");

    if (rollback) {
      console.log("⚠️  WARNING: This will delete ALL days from the database!");
      console.log("Original workouts will remain untouched.");
      console.log("");
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("Are you sure you want to continue? (yes/no): ", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "yes") {
        console.log("Rollback cancelled.");
        process.exit(0);
      }

      await migration.down(db, mockAuth);
    } else {
      if (!dryRun) {
        console.log("⚠️  WARNING: This will create day documents for ALL users!");
        console.log("Original workouts will remain untouched (read-only).");
        console.log("");
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question("Are you sure you want to continue? (yes/no): ", resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== "yes") {
          console.log("Migration cancelled.");
          process.exit(0);
        }
      }

      await migration.up(db, mockAuth, dryRun);
    }

    console.log("\n✅ Migration script completed!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
