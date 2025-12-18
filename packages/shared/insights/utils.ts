/**
 * LiftLedger Insights Utilities
 * 
 * Helper functions for extracting exercise history and determining
 * when to fetch insights from the API.
 * 
 * Platform-agnostic implementation.
 */

import type { Day } from "../firestore/days";
import type { Exercise } from "../firestore/workouts";
import type { ProgressPoint } from "./api";
import { parseISO, differenceInDays } from "date-fns";

const MIN_SESSIONS = 8; // Minimum number of logs required
const MIN_DURATION_DAYS = 14; // Minimum duration in days

/**
 * Extract historical data points for a specific exercise from days
 * 
 * @param days - Array of Day objects containing exercise history
 * @param exerciseId - Exercise ID or name to filter by
 * @param modality - Exercise modality (strength, cardio, calisthenics)
 * @returns Array of progress points sorted by date ascending
 */
export function extractExerciseHistory(
  days: Day[],
  exerciseId: string,
  modality: "strength" | "cardio" | "calisthenics"
): ProgressPoint[] {
  const history: ProgressPoint[] = [];

  // Filter and sort days by date ascending
  const sortedDays = [...days]
    .filter((day) => !day.isRestDay && day.exercises.length > 0)
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });

  for (const day of sortedDays) {
    const exercise = day.exercises.find(
      (ex) => (ex.exerciseId || ex.name) === exerciseId && ex.modality === modality
    );

    if (!exercise) continue;

    let value: number | null = null;

    if (modality === "strength" && exercise.strengthSets && exercise.strengthSets.length > 0) {
      // Extract max weight from all sets for this day
      value = Math.max(...exercise.strengthSets.map((set) => set.weight || 0));
    } else if (modality === "cardio" && exercise.cardioData) {
      // Prefer distance, fallback to duration
      if (exercise.cardioData.distance && exercise.cardioData.distance > 0) {
        value = exercise.cardioData.distance;
      } else if (exercise.cardioData.duration && exercise.cardioData.duration > 0) {
        value = exercise.cardioData.duration;
      }
    } else if (
      modality === "calisthenics" &&
      exercise.calisthenicsSets &&
      exercise.calisthenicsSets.length > 0
    ) {
      // Extract max reps from all sets for this day
      value = Math.max(...exercise.calisthenicsSets.map((set) => set.reps || 0));
    }

    // Only add if we have a valid value
    if (value !== null && value > 0 && !isNaN(value)) {
      history.push({
        date: day.date, // Already in YYYY-MM-DD format
        value: value,
      });
    }
  }

  return history;
}

/**
 * Determine if insights should be fetched based on history length and duration
 * 
 * @param history - Array of progress points
 * @returns True if history meets minimum requirements
 */
export function shouldFetchInsight(history: ProgressPoint[]): boolean {
  if (history.length < MIN_SESSIONS) {
    return false;
  }

  if (history.length === 0) {
    return false;
  }

  // Check minimum duration between first and latest
  const firstDate = parseISO(history[0].date);
  const latestDate = parseISO(history[history.length - 1].date);
  const daysDiff = differenceInDays(latestDate, firstDate);

  return daysDiff >= MIN_DURATION_DAYS;
}

/**
 * Check if the latest exercise log is a new personal record
 * 
 * @param history - Array of progress points (must be sorted by date ascending)
 * @returns True if latest value is strictly greater than all previous values
 */
export function isNewPR(history: ProgressPoint[]): boolean {
  if (history.length < 2) {
    return false; // Need at least 2 points to compare
  }

  const latestValue = history[history.length - 1].value;
  const previousValues = history.slice(0, -1).map((point) => point.value);

  // Latest value must be strictly greater than all previous values
  return previousValues.every((prevValue) => latestValue > prevValue);
}

/**
 * Map exercise modality to metric name for the API
 * 
 * @param modality - Exercise modality
 * @param hasDistance - For cardio, whether distance is available
 * @returns Metric name string
 */
export function getMetricName(
  modality: "strength" | "cardio" | "calisthenics",
  hasDistance: boolean = false
): string {
  switch (modality) {
    case "strength":
      return "weight";
    case "cardio":
      return hasDistance ? "distance" : "duration";
    case "calisthenics":
      return "reps";
    default:
      return "weight"; // Default fallback
  }
}

