import {
  calculateLongestStreakFromDays,
  calculateTotalVolumeFromDays,
  findAllPRs,
} from "./analytics/calculations";
import { isLoggedDay, type Day } from "./firestore/days";

export const MAX_FEATURED_ACHIEVEMENTS = 5;

export type AchievementIcon =
  | "dumbbell"
  | "flame"
  | "trophy"
  | "heart"
  | "moon"
  | "medal"
  | "zap"
  | "calendar"
  | "target"
  | "award";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  tier: 1 | 2 | 3;
};

export type EarnedAchievement = {
  earnedAt: string;
};

export type EarnedMap = Record<string, EarnedAchievement>;

export type ProfileStats = {
  currentStreak: number;
  longestStreak: number;
  loggedDays: number;
};

export type AchievementProgress = {
  earned: EarnedMap;
  featuredIds: string[];
  stats: ProfileStats;
};

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  { id: "first_session", title: "First log", description: "Save a training day.", icon: "dumbbell", tier: 1 },
  { id: "rest_day", title: "Recovery", description: "Mark a rest day.", icon: "moon", tier: 1 },
  { id: "iron", title: "Iron", description: "Log a strength lift.", icon: "dumbbell", tier: 1 },
  { id: "cardio_club", title: "Miles", description: "Log a cardio session.", icon: "heart", tier: 1 },
  { id: "bodyweight", title: "Bodyweight", description: "Log calisthenics.", icon: "zap", tier: 1 },
  { id: "streak_3", title: "On a roll", description: "Reach a 3-day streak.", icon: "flame", tier: 1 },
  { id: "streak_7", title: "Week warrior", description: "Reach a 7-day streak.", icon: "flame", tier: 2 },
  { id: "streak_14", title: "Fortnight", description: "Reach a 14-day streak.", icon: "flame", tier: 2 },
  { id: "streak_30", title: "Unbroken month", description: "Reach a 30-day streak.", icon: "flame", tier: 3 },
  { id: "sessions_10", title: "Ten days", description: "Log 10 training days.", icon: "calendar", tier: 1 },
  { id: "sessions_25", title: "Twenty-five", description: "Log 25 training days.", icon: "calendar", tier: 2 },
  { id: "sessions_50", title: "Fifty", description: "Log 50 training days.", icon: "calendar", tier: 3 },
  { id: "first_pr", title: "New high", description: "Hit your first PR.", icon: "trophy", tier: 1 },
  { id: "prs_5", title: "PR hunter", description: "Hold 5 personal records.", icon: "medal", tier: 2 },
  { id: "volume_10k", title: "10k volume", description: "Accumulate 10,000 lb of working volume.", icon: "target", tier: 2 },
  { id: "volume_50k", title: "50k volume", description: "Accumulate 50,000 lb of working volume.", icon: "award", tier: 3 },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_CATALOG.map((item) => [item.id, item])
);

export function parseEarnedMap(raw: unknown): EarnedMap {
  if (!raw || typeof raw !== "object") return {};
  const out: EarnedMap = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ACHIEVEMENT_BY_ID[id]) continue;
    if (value && typeof value === "object" && typeof (value as EarnedAchievement).earnedAt === "string") {
      out[id] = { earnedAt: (value as EarnedAchievement).earnedAt };
    }
  }
  return out;
}

export function parseFeaturedIds(raw: unknown, earned: EarnedMap): string[] {
  const ids = Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
  return ids.filter((id) => Boolean(earned[id] && ACHIEVEMENT_BY_ID[id])).slice(0, MAX_FEATURED_ACHIEVEMENTS);
}

export function parseProfileStats(raw: unknown): ProfileStats {
  if (!raw || typeof raw !== "object") {
    return { currentStreak: 0, longestStreak: 0, loggedDays: 0 };
  }
  const data = raw as Record<string, unknown>;
  const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
  return {
    currentStreak: n(data.currentStreak),
    longestStreak: n(data.longestStreak),
    loggedDays: n(data.loggedDays),
  };
}

export function evaluateEarnedIds(days: Day[]): string[] {
  const logged = days.filter(isLoggedDay);
  const trainingDays = logged.filter((day) => day.exercises.length > 0);
  const longest = calculateLongestStreakFromDays(days);
  const volume = calculateTotalVolumeFromDays(days);
  const prs = findAllPRs(days);
  const has = (modality: string) => trainingDays.some((day) => day.exercises.some((ex) => ex.modality === modality));

  const earned: string[] = [];
  if (trainingDays.length > 0) earned.push("first_session");
  if (logged.some((day) => day.isRestDay)) earned.push("rest_day");
  if (has("strength")) earned.push("iron");
  if (has("cardio")) earned.push("cardio_club");
  if (has("calisthenics")) earned.push("bodyweight");
  if (longest >= 3) earned.push("streak_3");
  if (longest >= 7) earned.push("streak_7");
  if (longest >= 14) earned.push("streak_14");
  if (longest >= 30) earned.push("streak_30");
  if (trainingDays.length >= 10) earned.push("sessions_10");
  if (trainingDays.length >= 25) earned.push("sessions_25");
  if (trainingDays.length >= 50) earned.push("sessions_50");
  if (prs.length > 0) earned.push("first_pr");
  if (prs.length >= 5) earned.push("prs_5");
  if (volume >= 10_000) earned.push("volume_10k");
  if (volume >= 50_000) earned.push("volume_50k");
  return earned;
}

export function mergeNewlyEarned(
  previous: EarnedMap,
  ids: string[],
  earnedAt: string
): { next: EarnedMap; added: string[] } {
  const next = { ...previous };
  const added: string[] = [];
  for (const id of ids) {
    if (!ACHIEVEMENT_BY_ID[id] || next[id]) continue;
    next[id] = { earnedAt };
    added.push(id);
  }
  return { next, added };
}

export function autoFeatureNewUnlocks(featuredIds: string[], added: string[], earned: EarnedMap): string[] {
  const next = featuredIds.filter((id) => Boolean(earned[id]));
  for (const id of added) {
    if (next.length >= MAX_FEATURED_ACHIEVEMENTS) break;
    if (!next.includes(id)) next.push(id);
  }
  return next.slice(0, MAX_FEATURED_ACHIEVEMENTS);
}

export function toggleFeaturedId(featuredIds: string[], id: string, earned: EarnedMap): string[] {
  if (!earned[id] || !ACHIEVEMENT_BY_ID[id]) return featuredIds;
  if (featuredIds.includes(id)) return featuredIds.filter((item) => item !== id);
  if (featuredIds.length >= MAX_FEATURED_ACHIEVEMENTS) return featuredIds;
  return [...featuredIds, id];
}
