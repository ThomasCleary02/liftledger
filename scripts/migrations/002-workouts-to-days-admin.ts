/**
 * Migration: Workouts to Days (Admin SDK Version)
 * 
 * This version uses Firebase Admin SDK to bypass Firestore security rules.
 * Use this if you have Admin SDK set up, or if Firestore rules prevent reading all workouts.
 * 
 * CRITICAL CONSTRAINTS:
 * - Never delete or update existing workouts. Read-only access only.
 * - Idempotent: Safe to re-run multiple times
 * - Uses local timezone (not UTC) for date normalization
 * - Groups multiple workouts on the same day into a single day document
 * - Migrates ALL users' data at once
 * 
 * Prerequisites:
 *   npm install firebase-admin
 *   Set GOOGLE_APPLICATION_CREDENTIALS environment variable to service account key path
 *   OR set FIREBASE_ADMIN_PROJECT_ID and use Application Default Credentials
 */

import * as admin from "firebase-admin";
import { format, parseISO } from "date-fns";
import type { Timestamp } from "firebase-admin/firestore";

// Initialize Admin SDK
if (!admin.apps.length) {
  try {
    // Try to initialize with service account
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK");
    console.error("Make sure you have:");
    console.error("1. Installed firebase-admin: npm install firebase-admin");
    console.error("2. Set GOOGLE_APPLICATION_CREDENTIALS to your service account key");
    console.error("   OR configured Application Default Credentials");
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Normalize a date to YYYY-MM-DD format using local timezone
 * CRITICAL: Use local timezone, NOT UTC, to avoid off-by-one streak bugs
 */
function normalizeDateToYYYYMMDD(input: Date | Timestamp | string): string {
  let date: Date;
  
  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    date = parseISO(input);
  } else if (input instanceof admin.firestore.Timestamp) {
    date = input.toDate();
  } else {
    date = input;
  }
  
  return format(date, "yyyy-MM-dd");
}

/**
 * Group workouts by userId and date (YYYY-MM-DD)
 */
function groupWorkoutsByUserAndDate(workouts: any[]): Map<string, Map<string, any[]>> {
  const grouped = new Map<string, Map<string, any[]>>();
  
  workouts.forEach(workout => {
    const userId = workout.ownerId || workout.userId || "";
    if (!userId) {
      console.warn(`  [WARN] Workout ${workout.id || "unknown"} has no ownerId, skipping`);
      return;
    }
    
    const dateStr = normalizeDateToYYYYMMDD(workout.date);
    
    if (!grouped.has(userId)) {
      grouped.set(userId, new Map());
    }
    
    const userDates = grouped.get(userId)!;
    if (!userDates.has(dateStr)) {
      userDates.set(dateStr, []);
    }
    userDates.get(dateStr)!.push(workout);
  });
  
  return grouped;
}

/**
 * Merge exercises from multiple workouts into a single array
 */
function mergeExercises(workouts: any[]): any[] {
  const allExercises: any[] = [];
  
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  sortedWorkouts.forEach(workout => {
    if (Array.isArray(workout.exercises)) {
      allExercises.push(...workout.exercises);
    }
  });
  
  return allExercises;
}

/**
 * Migration function (Admin SDK version)
 */
export async function runMigration(dryRun: boolean = false): Promise<void> {
  console.log("=".repeat(60));
  console.log("Migration: Workouts to Days migration (All Users - Admin SDK)");
  console.log(`Dry run: ${dryRun ? "YES" : "NO"}`);
  console.log("=".repeat(60));
  
  // CRITICAL: Read-only access - read ALL workouts directly from Firestore
  console.log("Reading all workouts from Firestore (all users)...");
  const workoutsSnapshot = await db.collection("workouts").orderBy("date", "asc").get();
  
  const workouts = workoutsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date,
      exercises: data.exercises || [],
      ownerId: data.ownerId || "",
      totalVolume: data.totalVolume,
      totalReps: data.totalReps,
      totalCardioDuration: data.totalCardioDuration,
      exerciseIds: data.exerciseIds,
    };
  });
  
  console.log(`Found ${workouts.length} workouts across all users`);
  
  if (workouts.length === 0) {
    console.log("No workouts to migrate. Exiting.");
    return;
  }
  
  // Group workouts by user and date
  const byUserAndDate = groupWorkoutsByUserAndDate(workouts);
  const totalUsers = byUserAndDate.size;
  const totalDates = Array.from(byUserAndDate.values()).reduce((sum, dates) => sum + dates.size, 0);
  
  console.log(`Found ${totalUsers} user(s) with workouts`);
  console.log(`Grouped into ${totalDates} unique user-date combinations`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process each user
  for (const [userId, userDates] of byUserAndDate.entries()) {
    console.log(`\nProcessing user: ${userId}`);
    console.log(`  ${userDates.size} unique dates`);
    
    for (const [dateStr, dateWorkouts] of userDates.entries()) {
      try {
        const dayId = `${userId}_${dateStr}`;
        const dayRef = db.collection("days").doc(dayId);
        const existingDay = await dayRef.get();
        
        if (existingDay.exists) {
          console.log(`  [SKIP] Day for ${dateStr} already exists`);
          skipped++;
          continue;
        }
        
        const mergedExercises = mergeExercises(dateWorkouts);
        const now = admin.firestore.Timestamp.now();
        
        if (dryRun) {
          console.log(`  [DRY RUN] Would create day for ${dateStr}:`);
          console.log(`    - User: ${userId}`);
          console.log(`    - Workouts: ${dateWorkouts.length}`);
          console.log(`    - Exercises: ${mergedExercises.length}`);
          console.log(`    - Is rest day: false`);
          created++;
        } else {
          await dayRef.set({
            userId: userId,
            date: dateStr,
            isRestDay: false,
            exercises: mergedExercises,
            createdAt: now,
            updatedAt: now,
          });
          
          console.log(`  [CREATED] Day for ${dateStr} (${mergedExercises.length} exercises from ${dateWorkouts.length} workout(s))`);
          created++;
        }
      } catch (error: any) {
        console.error(`  [ERROR] Failed to process ${dateStr} for user ${userId}:`, error.message);
        errors++;
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary:");
  console.log(`  Total workouts processed: ${workouts.length}`);
  console.log(`  Users processed: ${totalUsers}`);
  console.log(`  Days ${dryRun ? "would be " : ""}created: ${created}`);
  console.log(`  Days skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log("=".repeat(60));
  
  if (dryRun) {
    console.log("\nThis was a DRY RUN. No data was written.");
    console.log("Run without --dry-run to execute the migration.");
  } else {
    console.log("\nMigration completed successfully!");
    console.log("CRITICAL: Original workouts remain untouched (read-only migration).");
  }
}

// If run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  
  runMigration(dryRun)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
