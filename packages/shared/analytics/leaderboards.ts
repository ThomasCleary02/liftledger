import { Day, isLoggedDay } from "../firestore/days";
import { parseISO, isValid } from "date-fns";
import {
  calculateTotalVolumeFromDays,
  calculateTotalCardioDurationFromDays,
  sumCardioDistanceByFamily,
  sumCardioDurationByFamily,
} from "./calculations";
import {
  CARDIO_DISTANCE_FAMILIES,
  type CardioDistanceFamily,
} from "../cardio";

export type LeaderboardTimePeriod = "7days" | "30days" | "all";

export type CardioDistanceLeaderboardUnit = "miles" | "steps" | "seconds";

export interface LeaderboardEntry {
  userId: string;
  value: number;
  rank: number;
}

export interface VolumeLeaderboardEntry extends LeaderboardEntry {
  value: number; // total volume in lb/kg
}

export interface CardioDurationLeaderboardEntry extends LeaderboardEntry {
  value: number; // total cardio duration in seconds
}

/** @deprecated Prefer CardioDurationLeaderboardEntry for the time board. */
export type CardioDistanceLeaderboardEntry = CardioDurationLeaderboardEntry;

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
    if (!isValid(dayDate)) {
      console.warn(`[filterDaysByTimePeriod] Invalid date: ${day.date}`);
      return false;
    }
    // Normalize dayDate to start of day (create new Date to avoid mutation)
    const normalizedDayDate = new Date(dayDate);
    normalizedDayDate.setHours(0, 0, 0, 0);
    return normalizedDayDate >= cutoffDate;
  });
}

function rankEntries<T extends LeaderboardEntry>(entries: T[]): T[] {
  entries.sort((a, b) => b.value - a.value);
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].value < entries[i - 1].value) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }
  return entries;
}

function filteredDaysByUser(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod
): Record<string, Day[]> {
  const out: Record<string, Day[]> = {};
  for (const [userId, days] of Object.entries(daysByUser)) {
    out[userId] = filterDaysByTimePeriod(days, timePeriod);
  }
  return out;
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

  return rankEntries(entries);
}

/**
 * Rank friends by total cardio time (fair across modalities).
 */
export function getCardioDurationLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod = "all"
): CardioDurationLeaderboardEntry[] {
  const entries: CardioDurationLeaderboardEntry[] = [];

  for (const [userId, days] of Object.entries(daysByUser)) {
    const filteredDays = filterDaysByTimePeriod(days, timePeriod);
    const duration = calculateTotalCardioDurationFromDays(filteredDays);

    entries.push({
      userId,
      value: duration,
      rank: 0,
    });
  }

  return rankEntries(entries);
}

/**
 * Unit for a family distance board. Row uses miles when any cohort member logged
 * row distance; otherwise seconds (duration-only row board).
 */
export function getCardioDistanceLeaderboardUnit(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod,
  family: CardioDistanceFamily
): CardioDistanceLeaderboardUnit {
  if (family === "stair") return "steps";
  if (family === "row") {
    const filtered = filteredDaysByUser(daysByUser, timePeriod);
    const anyMiles = Object.values(filtered).some(
      (days) => sumCardioDistanceByFamily(days, "row") > 0
    );
    return anyMiles ? "miles" : "seconds";
  }
  return "miles";
}

/**
 * True when anyone in the cohort has a non-zero score for this family in the period.
 * Row counts duration when no miles are present (duration-only row board).
 */
export function cohortHasCardioDistanceFamily(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod,
  family: CardioDistanceFamily
): boolean {
  const filtered = filteredDaysByUser(daysByUser, timePeriod);
  const unit = getCardioDistanceLeaderboardUnit(daysByUser, timePeriod, family);
  for (const days of Object.values(filtered)) {
    if (unit === "seconds") {
      if (sumCardioDurationByFamily(days, family) > 0) return true;
    } else if (sumCardioDistanceByFamily(days, family) > 0) {
      return true;
    }
  }
  return false;
}

/** Families that have data among the cohort for the selected period. */
export function availableCardioDistanceFamilies(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod
): CardioDistanceFamily[] {
  return CARDIO_DISTANCE_FAMILIES.filter((family) =>
    cohortHasCardioDistanceFamily(daysByUser, timePeriod, family)
  );
}

/**
 * Rank friends by comparable cardio distance/steps for a family.
 * foot/bike → miles; stair → steps; row → miles when logged, else duration.
 */
export function getCardioDistanceLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod?: LeaderboardTimePeriod,
  family?: CardioDistanceFamily
): LeaderboardEntry[];
/**
 * @deprecated Call getCardioDurationLeaderboard — the old 2-arg form ranked by duration.
 */
export function getCardioDistanceLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod?: LeaderboardTimePeriod
): CardioDurationLeaderboardEntry[];
export function getCardioDistanceLeaderboard(
  daysByUser: Record<string, Day[]>,
  timePeriod: LeaderboardTimePeriod = "all",
  family?: CardioDistanceFamily
): LeaderboardEntry[] {
  if (family === undefined) {
    return getCardioDurationLeaderboard(daysByUser, timePeriod);
  }

  const filtered = filteredDaysByUser(daysByUser, timePeriod);
  const unit = getCardioDistanceLeaderboardUnit(daysByUser, timePeriod, family);
  const entries: LeaderboardEntry[] = [];

  for (const [userId, days] of Object.entries(filtered)) {
    const value =
      unit === "seconds"
        ? sumCardioDurationByFamily(days, family)
        : sumCardioDistanceByFamily(days, family);

    entries.push({
      userId,
      value,
      rank: 0,
    });
  }

  return rankEntries(entries);
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
    const activeDays = filteredDays.filter(isLoggedDay);

    entries.push({
      userId,
      value: activeDays.length,
      rank: 0, // Will be set after sorting
    });
  }

  return rankEntries(entries);
}
