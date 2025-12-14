import { Day } from "../firestore/days";
import { parseISO, isValid } from "date-fns";
import {
  calculateTotalVolumeFromDays,
  calculateTotalCardioDistanceFromDays,
  calculateCurrentStreakFromDays,
} from "./calculations";

export type LeaderboardTimePeriod = "7days" | "30days" | "all";

export interface LeaderboardEntry {
  userId: string;
  value: number;
  rank: number;
}

export interface VolumeLeaderboardEntry extends LeaderboardEntry {
  value: number; // total volume in lb/kg
}

export interface CardioDistanceLeaderboardEntry extends LeaderboardEntry {
  value: number; // total distance in mi/km
}

export interface ConsistencyLeaderboardEntry extends LeaderboardEntry {
  value: number; // number of active days (workouts or rest days)
}

/**
 * Filter days by time period
 * Uses the same logic as filterDaysByPeriod in calculations.ts
 */
function filterDaysByTimePeriod(
  days: Day[],
  timePeriod: LeaderboardTimePeriod
): Day[] {
  if (timePeriod === "all") {
    return days;
  }

  const now = new Date();
  let cutoffDate: Date;

  if (timePeriod === "7days") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 7);
  } else {
    // 30days
    cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 30);
  }

  // Normalize cutoffDate to start of day for proper comparison
  cutoffDate.setHours(0, 0, 0, 0);

  return days.filter((day) => {
    const dayDate = parseISO(day.date);
    // Check if date is valid
    if (isNaN(dayDate.getTime())) {
      console.warn(`[filterDaysByTimePeriod] Invalid date: ${day.date}`);
      return false;
    }
    // Normalize dayDate to start of day (create new Date to avoid mutation)
    const normalizedDayDate = new Date(dayDate);
    normalizedDayDate.setHours(0, 0, 0, 0);
    return normalizedDayDate >= cutoffDate;
  });
}

/**
 * Get volume leaderboard from days grouped by user
 * Returns ranked list of users by total volume (strength exercises only)
 */
export function getVolumeLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod = "all"
): VolumeLeaderboardEntry[] {
  const entries: VolumeLeaderboardEntry[] = [];

  for (const [userId, days] of Object.entries(daysByUser)) {
    const filteredDays = filterDaysByTimePeriod(days, timePeriod);
    const volume = calculateTotalVolumeFromDays(filteredDays);
    

    entries.push({
      userId,
      value: volume,
      rank: 0, // Will be set after sorting
    });
  }

  // Sort by volume descending
  entries.sort((a, b) => b.value - a.value);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value < entries[i - 1].value) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}

/**
 * Get cardio distance leaderboard from days grouped by user
 * Returns ranked list of users by total cardio distance
 */
export function getCardioDistanceLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod = "all"
): CardioDistanceLeaderboardEntry[] {
  const entries: CardioDistanceLeaderboardEntry[] = [];

  for (const [userId, days] of Object.entries(daysByUser)) {
    const filteredDays = filterDaysByTimePeriod(days, timePeriod);
    const distance = calculateTotalCardioDistanceFromDays(filteredDays);

    entries.push({
      userId,
      value: distance,
      rank: 0, // Will be set after sorting
    });
  }

  // Sort by distance descending
  entries.sort((a, b) => b.value - a.value);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value < entries[i - 1].value) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}

/**
 * Get consistency leaderboard from days grouped by user
 * Returns ranked list of users by number of active days (workouts or rest days)
 */
export function getConsistencyLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod = "all"
): ConsistencyLeaderboardEntry[] {
  const entries: ConsistencyLeaderboardEntry[] = [];

  for (const [userId, days] of Object.entries(daysByUser)) {
    const filteredDays = filterDaysByTimePeriod(days, timePeriod);
    
    // Count active days: days with exercises or marked as rest day
    const activeDays = filteredDays.filter(
      (day) => day.exercises.length > 0 || day.isRestDay
    );

    entries.push({
      userId,
      value: activeDays.length,
      rank: 0, // Will be set after sorting
    });
  }

  // Sort by active days count descending
  entries.sort((a, b) => b.value - a.value);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value < entries[i - 1].value) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}
