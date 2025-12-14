/**
 * Migration: Workouts to Days
 * 
 * CRITICAL CONSTRAINTS:
 * - Never delete or update existing workouts. Read-only access only.
 * - Idempotent: Safe to re-run multiple times
 * - Uses local timezone (not UTC) for date normalization
 * - Groups multiple workouts on the same day into a single day document
 * - Migrates ALL users' data at once
 */

import type { Firestore } from "firebase/firestore";
import { Timestamp, collection, getDocs, query, orderBy, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { Workout, Exercise } from "../../packages/shared/firestore/workouts";
import { format, parseISO } from "date-fns";

/**
 * Normalize a date to YYYY-MM-DD format using local timezone
 * CRITICAL: Use local timezone, NOT UTC, to avoid off-by-one streak bugs
 */
function normalizeDateToYYYYMMDD(input: Date | Timestamp | string): string {
  let date: Date;
  
  if (typeof input === "string") {
    // If it's already a YYYY-MM-DD string, validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    // Otherwise parse it
    date = parseISO(input);
  } else if (input instanceof Timestamp) {
    // Convert Firestore Timestamp to Date (this uses local timezone)
    date = input.toDate();
  } else {
    date = input;
  }
  
  // Use date-fns format with local timezone (not toISOString which uses UTC)
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
    
    // Normalize workout date to YYYY-MM-DD
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
 * Preserves all exercises in order (by workout date/time if available)
 */
function mergeExercises(workouts: any[]): Exercise[] {
  const allExercises: Exercise[] = [];
  
  // Sort workouts by date to preserve chronological order
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date as any);
    const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date as any);
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
 * Migration function
 * 
 * Usage:
 *   npx tsx scripts/migrations/002-workouts-to-days.ts [--dry-run] [--rollback]
 */
export const migration = {
  version: 2,
  name: "Workouts to Days migration (All Users)",
  
  /**
   * Run migration (up)
   * @param db Firestore instance
   * @param auth Auth instance (not used, but kept for compatibility)
   * @param dryRun If true, only log what would be created without writing
   */
  async up(db: Firestore, auth: any, dryRun: boolean = false): Promise<void> {
    console.log("=".repeat(60));
    console.log(`Migration: ${this.name}`);
    console.log(`Dry run: ${dryRun ? "YES" : "NO"}`);
    console.log("=".repeat(60));
    
    // CRITICAL: Read-only access - read ALL workouts directly from Firestore
    // This bypasses the service layer's user filtering to get all users' data
    console.log("Reading all workouts from Firestore (all users)...");
    const workoutsCol = collection(db, "workouts");
    const workoutsQuery = query(workoutsCol, orderBy("date", "asc"));
    const snapshot = await getDocs(workoutsQuery);
    
    const workouts = snapshot.docs.map(doc => {
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
      
      // Process each date for this user
      for (const [dateStr, dateWorkouts] of userDates.entries()) {
        try {
          // Generate day ID: ${userId}_${YYYY-MM-DD}
          const dayId = `${userId}_${dateStr}`;
          
          // Check if day already exists (idempotency) - read directly from Firestore
          const dayDocRef = doc(db, "days", dayId);
          const existingDaySnap = await getDoc(dayDocRef);
          
          if (existingDaySnap.exists()) {
            console.log(`  [SKIP] Day for ${dateStr} already exists`);
            skipped++;
            continue;
          }
          
          // Merge exercises from all workouts on this date
          const mergedExercises = mergeExercises(dateWorkouts);
          
          if (dryRun) {
            console.log(`  [DRY RUN] Would create day for ${dateStr}:`);
            console.log(`    - User: ${userId}`);
            console.log(`    - Workouts: ${dateWorkouts.length}`);
            console.log(`    - Exercises: ${mergedExercises.length}`);
            console.log(`    - Is rest day: false`);
            created++;
          } else {
            // Create day document directly in Firestore
            // This bypasses the service layer's auth check, allowing us to create days for any user
            const now = Timestamp.now();
            await setDoc(dayDocRef, {
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
  },
  
  /**
   * Rollback (down) - optional
   * Note: This would delete days, but workouts remain untouched
   */
  async down(db: Firestore, auth: any): Promise<void> {
    console.log("Rollback: Deleting all days...");
    const daysCol = collection(db, "days");
    const daysQuery = query(daysCol, orderBy("date", "asc"));
    const snapshot = await getDocs(daysQuery);
    
    let deleted = 0;
    for (const dayDoc of snapshot.docs) {
      await deleteDoc(doc(db, "days", dayDoc.id));
      console.log(`Deleted day: ${dayDoc.data().date}`);
      deleted++;
    }
    
    console.log(`Rollback complete: Deleted ${deleted} days`);
    console.log("Note: Original workouts remain untouched.");
  }
};
