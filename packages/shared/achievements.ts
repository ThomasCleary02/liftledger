import { getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import {
  calculateLongestStreakFromDays,
  calculateTotalCalisthenicsRepsFromDays,
  calculateTotalCardioDurationFromDays,
  calculateTotalVolumeFromDays,
} from "./analytics/calculations";
import { maxWorkingWeight } from "./sets";
import { type Day } from "./firestore/days";

export const MAX_FEATURED_ACHIEVEMENTS = 3;

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
  volumeLbs: number;
};

export type AchievementProgress = {
  earned: EarnedMap;
  featuredIds: string[];
  stats: ProfileStats;
};

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    id: "true_pr",
    title: "True PR",
    description: "Log the same lift twice and beat your earlier best. First-time weights do not count.",
    icon: "trophy",
    tier: 1,
  },
  {
    id: "rhythm_4",
    title: "Real month",
    description: "Train at least 3 days in each of 4 different weeks.",
    icon: "calendar",
    tier: 1,
  },
  {
    id: "toolbox",
    title: "Toolbox",
    description: "Log 12 different exercises.",
    icon: "dumbbell",
    tier: 1,
  },
  {
    id: "hybrid_week",
    title: "Hybrid week",
    description: "Strength and cardio in the same calendar week.",
    icon: "heart",
    tier: 1,
  },
  {
    id: "rest_steward",
    title: "Rest days",
    description: "Mark 8 rest days. Recovery is part of the ledger.",
    icon: "moon",
    tier: 1,
  },
  {
    id: "streak_7",
    title: "Week on fire",
    description: "A 7-day streak of training or rest.",
    icon: "flame",
    tier: 2,
  },
  {
    id: "week_streak_8",
    title: "Eight weeks",
    description: "Train in 8 consecutive calendar weeks.",
    icon: "flame",
    tier: 2,
  },
  {
    id: "pr_repeat",
    title: "Five PRs",
    description: "Beat yourself 5 times across your lifts.",
    icon: "medal",
    tier: 2,
  },
  {
    id: "loyal",
    title: "Loyal lift",
    description: "Keep one exercise in the log across 16 different weeks.",
    icon: "target",
    tier: 2,
  },
  {
    id: "sessions_50",
    title: "Fifty sessions",
    description: "50 days with work in them, not rest.",
    icon: "calendar",
    tier: 2,
  },
  {
    id: "engine",
    title: "Engine",
    description: "Accumulate 10 hours of cardio.",
    icon: "heart",
    tier: 2,
  },
  {
    id: "volume_250k",
    title: "Quarter million",
    description: "250,000 lb of working strength volume.",
    icon: "zap",
    tier: 2,
  },
  {
    id: "streak_30",
    title: "Unbroken month",
    description: "A 30-day streak.",
    icon: "flame",
    tier: 3,
  },
  {
    id: "rhythm_12",
    title: "Season",
    description: "12 weeks with at least 3 trained days each.",
    icon: "award",
    tier: 3,
  },
  {
    id: "pr_machine",
    title: "PR machine",
    description: "15 true PRs — improvements, not openers.",
    icon: "trophy",
    tier: 3,
  },
  {
    id: "sessions_100",
    title: "Century",
    description: "100 trained days.",
    icon: "calendar",
    tier: 3,
  },
  {
    id: "volume_1m",
    title: "Million pounds",
    description: "1,000,000 lb of working volume.",
    icon: "award",
    tier: 3,
  },
  {
    id: "thousand_reps",
    title: "Thousand reps",
    description: "1,000 calisthenics reps.",
    icon: "zap",
    tier: 3,
  },
];

/**
 * Ideas for later medals. Not in the live catalog — do not evaluate or pin these.
 * Add them when the feature exists so the bronze/silver/gold set stays honest.
 */
export type AchievementRoadmapItem = {
  id: string;
  title: string;
  hook: string;
  when: string;
};

export const ACHIEVEMENT_ROADMAP: AchievementRoadmapItem[] = [
  {
    id: "later_posted_week",
    title: "Posted the week",
    hook: "Share a week card once.",
    when: "Week share already exists; award on first successful export.",
  },
  {
    id: "later_ghost_writer",
    title: "Ghost writer",
    hook: "Import a year of training history.",
    when: "After import can prove span, not just row count.",
  },
  {
    id: "later_two_names",
    title: "Two names, one ledger",
    hook: "Add a friend who accepts.",
    when: "Friend request accepted — social, not a spam invite.",
  },
  {
    id: "later_close_the_book",
    title: "Close the book",
    hook: "Finish a starter program.",
    when: "Programs need a real complete state.",
  },
  {
    id: "later_scale_witness",
    title: "Scale witness",
    hook: "Twelve weigh-ins on the ledger.",
    when: "Bodyweight tracking is on; just count distinct days.",
  },
  {
    id: "later_quiet_gym",
    title: "Quiet gym",
    hook: "Log a session that started offline.",
    when: "Gym-floor offline logging ships.",
  },
  {
    id: "later_mileage_club",
    title: "Mileage club",
    hook: "One hundred miles of running (not walk).",
    when: "Cardio already has distance; keep walk out of it. Harder distance tier — not another easy badge.",
  },
  {
    id: "later_long_haul",
    title: "Long haul",
    hook: "Fifty hours of cardio (beyond Engine’s 10).",
    when: "Same duration counter as Engine; ship only as a hard tier, not a stack of easy hour badges.",
  },
  {
    id: "later_same_fight",
    title: "Same fight",
    hook: "Beat a friend on a weekly board.",
    when: "Leaderboards can name a head-to-head week.",
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_CATALOG.map((item) => [item.id, item])
);

export function defaultFeaturedIds(earned: EarnedMap): string[] {
  return ACHIEVEMENT_CATALOG.filter((item) => earned[item.id])
    .sort((a, b) => b.tier - a.tier)
    .slice(0, MAX_FEATURED_ACHIEVEMENTS)
    .map((item) => item.id);
}

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
  if (!Array.isArray(raw)) return defaultFeaturedIds(earned);
  const ids = raw.filter((id): id is string => typeof id === "string");
  return ids.filter((id) => Boolean(earned[id] && ACHIEVEMENT_BY_ID[id])).slice(0, MAX_FEATURED_ACHIEVEMENTS);
}

export function parseProfileStats(raw: unknown): ProfileStats {
  if (!raw || typeof raw !== "object") {
    return { currentStreak: 0, longestStreak: 0, loggedDays: 0, volumeLbs: 0 };
  }
  const data = raw as Record<string, unknown>;
  const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
  return {
    currentStreak: n(data.currentStreak),
    longestStreak: n(data.longestStreak),
    loggedDays: n(data.loggedDays),
    volumeLbs: n(data.volumeLbs),
  };
}

function isoWeekKey(date: string): string {
  const parsed = parseISO(date);
  return `${getISOWeekYear(parsed)}-${String(getISOWeek(parsed)).padStart(2, "0")}`;
}

function nextIsoWeek(key: string): string {
  const [yearPart, weekPart] = key.split("-");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (week < 52) return `${year}-${String(week + 1).padStart(2, "0")}`;
  const probe = parseISO(`${year}-12-28`);
  const last = getISOWeek(probe);
  if (week < last) return `${year}-${String(week + 1).padStart(2, "0")}`;
  return `${year + 1}-01`;
}

function longestConsecutiveWeeks(keys: string[]): number {
  const unique = Array.from(new Set(keys)).sort();
  if (unique.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] === nextIsoWeek(unique[i - 1])) current += 1;
    else current = 1;
    best = Math.max(best, current);
  }
  return best;
}

function trainingDays(days: Day[]): Day[] {
  return days.filter((day) => !day.status && day.exercises.length > 0);
}

function uniqueExerciseIds(days: Day[]): Set<string> {
  const ids = new Set<string>();
  trainingDays(days).forEach((day) => {
    day.exercises.forEach((ex) => ids.add(ex.exerciseId || ex.name));
  });
  return ids;
}

function countTruePrs(days: Day[]): number {
  const series = new Map<string, number[]>();
  const ordered = [...trainingDays(days)].sort((a, b) => a.date.localeCompare(b.date));
  ordered.forEach((day) => {
    const seen = new Set<string>();
    day.exercises.forEach((ex) => {
      const id = `${ex.modality}:${ex.exerciseId || ex.name}`;
      if (seen.has(id)) return;
      let value = 0;
      if (ex.modality === "strength" && ex.strengthSets?.length) value = maxWorkingWeight(ex.strengthSets);
      else if (ex.modality === "calisthenics" && ex.calisthenicsSets?.length) {
        value = Math.max(...ex.calisthenicsSets.map((set) => set.reps || 0));
      } else if (ex.modality === "cardio" && ex.cardioData) {
        value = ex.cardioData.distance || ex.cardioData.duration || 0;
      }
      if (value <= 0) return;
      seen.add(id);
      const list = series.get(id) ?? [];
      list.push(value);
      series.set(id, list);
    });
  });

  let count = 0;
  series.forEach((values) => {
    let peak = values[0] ?? 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        count += 1;
        peak = values[i];
      }
    }
  });
  return count;
}

function weeksWithMinSessions(days: Day[], min: number): number {
  const counts = new Map<string, number>();
  trainingDays(days).forEach((day) => {
    const key = isoWeekKey(day.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.values()).filter((value) => value >= min).length;
}

function longestExerciseWeekSpan(days: Day[]): number {
  const weeks = new Map<string, Set<string>>();
  trainingDays(days).forEach((day) => {
    const key = isoWeekKey(day.date);
    day.exercises.forEach((ex) => {
      const id = ex.exerciseId || ex.name;
      const set = weeks.get(id) ?? new Set<string>();
      set.add(key);
      weeks.set(id, set);
    });
  });
  let best = 0;
  weeks.forEach((set) => {
    best = Math.max(best, set.size);
  });
  return best;
}

function hasHybridWeek(days: Day[]): boolean {
  const flags = new Map<string, { strength: boolean; cardio: boolean }>();
  trainingDays(days).forEach((day) => {
    const key = isoWeekKey(day.date);
    const current = flags.get(key) ?? { strength: false, cardio: false };
    day.exercises.forEach((ex) => {
      if (ex.modality === "strength") current.strength = true;
      if (ex.modality === "cardio") current.cardio = true;
    });
    flags.set(key, current);
  });
  return Array.from(flags.values()).some((value) => value.strength && value.cardio);
}

export function evaluateEarnedIds(days: Day[]): string[] {
  const trained = trainingDays(days);
  const restDays = days.filter((day) => day.isRestDay && day.status !== "injured").length;
  const longest = calculateLongestStreakFromDays(days);
  const volume = calculateTotalVolumeFromDays(days);
  const truePrs = countTruePrs(days);
  const trainedWeeks = trained.map((day) => isoWeekKey(day.date));
  const earned: string[] = [];

  if (truePrs >= 1) earned.push("true_pr");
  if (weeksWithMinSessions(days, 3) >= 4) earned.push("rhythm_4");
  if (uniqueExerciseIds(days).size >= 12) earned.push("toolbox");
  if (hasHybridWeek(days)) earned.push("hybrid_week");
  if (restDays >= 8) earned.push("rest_steward");
  if (longest >= 7) earned.push("streak_7");
  if (longestConsecutiveWeeks(trainedWeeks) >= 8) earned.push("week_streak_8");
  if (truePrs >= 5) earned.push("pr_repeat");
  if (longestExerciseWeekSpan(days) >= 16) earned.push("loyal");
  if (trained.length >= 50) earned.push("sessions_50");
  if (calculateTotalCardioDurationFromDays(days) >= 10 * 3600) earned.push("engine");
  if (volume >= 250_000) earned.push("volume_250k");
  if (longest >= 30) earned.push("streak_30");
  if (weeksWithMinSessions(days, 3) >= 12) earned.push("rhythm_12");
  if (truePrs >= 15) earned.push("pr_machine");
  if (trained.length >= 100) earned.push("sessions_100");
  if (volume >= 1_000_000) earned.push("volume_1m");
  if (calculateTotalCalisthenicsRepsFromDays(days) >= 1000) earned.push("thousand_reps");
  return earned;
}

export type AchievementProgressMetric = {
  current: number;
  target: number;
  /** How to show the numbers in UI (default plain integers). */
  unit?: "count" | "hours" | "volume";
};

export function achievementTierLabel(tier: 1 | 2 | 3): string {
  if (tier === 1) return "Bronze";
  if (tier === 2) return "Silver";
  return "Gold";
}

/** Progress toward each live catalog medal. ROADMAP ids are never included. */
export function getAchievementProgress(days: Day[]): Record<string, AchievementProgressMetric> {
  const trained = trainingDays(days);
  const restDays = days.filter((day) => day.isRestDay && day.status !== "injured").length;
  const longest = calculateLongestStreakFromDays(days);
  const volume = calculateTotalVolumeFromDays(days);
  const truePrs = countTruePrs(days);
  const trainedWeeks = trained.map((day) => isoWeekKey(day.date));
  const weekStreak = longestConsecutiveWeeks(trainedWeeks);
  const rhythmWeeks = weeksWithMinSessions(days, 3);
  const exercises = uniqueExerciseIds(days).size;
  const loyalWeeks = longestExerciseWeekSpan(days);
  const cardioSeconds = calculateTotalCardioDurationFromDays(days);
  const reps = calculateTotalCalisthenicsRepsFromDays(days);
  const hybrid = hasHybridWeek(days) ? 1 : 0;

  const progress: Record<string, AchievementProgressMetric> = {
    true_pr: { current: Math.min(truePrs, 1), target: 1 },
    rhythm_4: { current: Math.min(rhythmWeeks, 4), target: 4 },
    toolbox: { current: Math.min(exercises, 12), target: 12 },
    hybrid_week: { current: hybrid, target: 1 },
    rest_steward: { current: Math.min(restDays, 8), target: 8 },
    streak_7: { current: Math.min(longest, 7), target: 7 },
    week_streak_8: { current: Math.min(weekStreak, 8), target: 8 },
    pr_repeat: { current: Math.min(truePrs, 5), target: 5 },
    loyal: { current: Math.min(loyalWeeks, 16), target: 16 },
    sessions_50: { current: Math.min(trained.length, 50), target: 50 },
    engine: {
      current: Math.min(cardioSeconds, 10 * 3600),
      target: 10 * 3600,
      unit: "hours",
    },
    volume_250k: { current: Math.min(volume, 250_000), target: 250_000, unit: "volume" },
    streak_30: { current: Math.min(longest, 30), target: 30 },
    rhythm_12: { current: Math.min(rhythmWeeks, 12), target: 12 },
    pr_machine: { current: Math.min(truePrs, 15), target: 15 },
    sessions_100: { current: Math.min(trained.length, 100), target: 100 },
    volume_1m: { current: Math.min(volume, 1_000_000), target: 1_000_000, unit: "volume" },
    thousand_reps: { current: Math.min(reps, 1000), target: 1000 },
  };
  return progress;
}

export function formatAchievementProgress(metric: AchievementProgressMetric): string {
  if (metric.unit === "hours") {
    const cur = metric.current / 3600;
    const tgt = metric.target / 3600;
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ""));
    return `${fmt(cur)} / ${fmt(tgt)} hr`;
  }
  if (metric.unit === "volume") {
    const fmt = (n: number) => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
      if (n >= 1000) return `${Math.round(n / 1000)}k`;
      return String(Math.round(n));
    };
    return `${fmt(metric.current)} / ${fmt(metric.target)} lb`;
  }
  return `${Math.floor(metric.current)} / ${metric.target}`;
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
  const kept = featuredIds.filter((id) => Boolean(earned[id] && ACHIEVEMENT_BY_ID[id]));
  if (kept.length > 0) return kept.slice(0, MAX_FEATURED_ACHIEVEMENTS);
  const firstUnlocks = added.length > 0 && Object.keys(earned).length === added.length;
  if (featuredIds.length === 0 && firstUnlocks) return defaultFeaturedIds(earned);
  return kept;
}

export function toggleFeaturedId(featuredIds: string[], id: string, earned: EarnedMap): string[] {
  if (!earned[id] || !ACHIEVEMENT_BY_ID[id]) return featuredIds;
  if (featuredIds.includes(id)) return featuredIds.filter((item) => item !== id);
  if (featuredIds.length >= MAX_FEATURED_ACHIEVEMENTS) return featuredIds;
  return [...featuredIds, id];
}
