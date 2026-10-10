import { getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import {
  calculateLongestStreakFromDays,
  calculateTotalCalisthenicsRepsFromDays,
  calculateTotalCardioDurationFromDays,
  calculateTotalVolumeFromDays,
} from "./analytics/calculations";
import { resolveCardioActivityType, type CardioActivityType } from "./cardio";
import { maxWorkingWeight } from "./sets";
import { type Day } from "./firestore/days";

const FOOT_ACTIVITY_TYPES = new Set<CardioActivityType>(["run", "walk", "hike"]);
const PUSH_UP_NAME = /\bpush[\s-]?ups?\b/i;
const PLANK_NAME = /\bplank\b/i;

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
  | "award"
  | "footprints"
  | "bike"
  | "mountain"
  | "person"
  | "repeat"
  | "sparkles"
  | "timer"
  | "shield"
  | "stairs";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  tier: 1 | 2 | 3 | 4 | 5;
  kind: "lifetime" | "challenge";
  /** Rolling window for challenge medals. */
  window?: { unit: "day"; length: number };
  /**
   * Soft-retire: stay in BY_ID for history + pins; browseCatalog hides unearned
   * retired defs; evaluateEarnedIds never newly awards retired defs.
   */
  retired?: boolean;
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
    kind: "lifetime",
  },
  {
    id: "rhythm_4",
    title: "Real month",
    description: "Train at least 3 days in each of 4 different weeks.",
    icon: "calendar",
    tier: 1,
    kind: "lifetime",
  },
  {
    id: "toolbox",
    title: "Toolbox",
    description: "Log 12 different exercises.",
    icon: "dumbbell",
    tier: 1,
    kind: "lifetime",
  },
  {
    id: "hybrid_week",
    title: "Hybrid week",
    description: "Strength and cardio in the same calendar week.",
    icon: "heart",
    tier: 1,
    kind: "lifetime",
  },
  {
    id: "rest_steward",
    title: "Rest days",
    description: "Mark 8 rest days. Recovery is part of the ledger.",
    icon: "moon",
    tier: 1,
    kind: "lifetime",
  },
  {
    id: "streak_7",
    title: "Week on fire",
    description: "A 7-day streak of training or rest.",
    icon: "flame",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "week_streak_8",
    title: "Eight weeks",
    description: "Train in 8 consecutive calendar weeks.",
    icon: "flame",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "pr_repeat",
    title: "Five PRs",
    description: "Beat yourself 5 times across your lifts.",
    icon: "medal",
    tier: 2,
    kind: "lifetime",
    retired: true,
  },
  {
    id: "stale_kill_90",
    title: "Stale kill",
    description: "Beat a true PR that stood for at least 90 days on the same lift.",
    icon: "trophy",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "same_fight",
    title: "Same fight",
    description: "True PR on a lift you already logged on at least 8 distinct trained days.",
    icon: "target",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "loyal",
    title: "Loyal lift",
    description: "Keep one exercise in the log across 16 different weeks.",
    icon: "target",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "sessions_50",
    title: "Fifty sessions",
    description: "50 days with work in them, not rest.",
    icon: "calendar",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "engine",
    title: "Engine",
    description: "Accumulate 10 hours of cardio.",
    icon: "heart",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "volume_250k",
    title: "Quarter million",
    description: "250,000 lb of working strength volume.",
    icon: "zap",
    tier: 2,
    kind: "lifetime",
  },
  {
    id: "streak_30",
    title: "Unbroken month",
    description: "A 30-day streak.",
    icon: "flame",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "rhythm_12",
    title: "Season",
    description: "12 weeks with at least 3 trained days each.",
    icon: "award",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "pr_machine",
    title: "PR machine",
    description: "15 true PRs — improvements, not openers.",
    icon: "trophy",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "sessions_100",
    title: "Century",
    description: "100 trained days.",
    icon: "calendar",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "volume_1m",
    title: "Million pounds",
    description: "1,000,000 lb of working volume.",
    icon: "award",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "thousand_reps",
    title: "Thousand reps",
    description: "1,000 calisthenics reps.",
    icon: "repeat",
    tier: 3,
    kind: "lifetime",
  },
  {
    id: "sessions_250",
    title: "Quarter thousand",
    description: "250 trained days.",
    icon: "calendar",
    tier: 4,
    kind: "lifetime",
    retired: true,
  },
  {
    id: "volume_2_5m",
    title: "Two and a half million",
    description: "2,500,000 lb of working volume.",
    icon: "zap",
    tier: 4,
    kind: "lifetime",
    retired: true,
  },
  {
    id: "engine_30",
    title: "Heartwood",
    description: "30 hours of cardio.",
    icon: "heart",
    tier: 4,
    kind: "lifetime",
  },
  {
    id: "streak_90",
    title: "Ninety days",
    description: "A 90-day streak.",
    icon: "flame",
    tier: 4,
    kind: "lifetime",
  },
  {
    id: "rhythm_26",
    title: "Half year rhythm",
    description: "26 weeks with at least 3 trained days each.",
    icon: "award",
    tier: 4,
    kind: "lifetime",
  },
  {
    id: "evergreen_200",
    title: "Evergreen",
    description: "200 trained days.",
    icon: "calendar",
    tier: 4,
    kind: "lifetime",
  },
  {
    id: "two_moons_60",
    title: "Two moons",
    description: "A 60-day streak.",
    icon: "flame",
    tier: 4,
    kind: "lifetime",
  },
  {
    id: "mileage_club_100",
    title: "Mileage club",
    description: "100 miles of running. Walk miles do not count.",
    icon: "footprints",
    tier: 5,
    kind: "lifetime",
  },
  {
    id: "long_haul_50",
    title: "Long haul",
    description: "50 hours of cardio.",
    icon: "heart",
    tier: 5,
    kind: "lifetime",
  },
  {
    id: "true_dynasty_50",
    title: "True dynasty",
    description: "50 true PRs — beat an earlier best of the same lift.",
    icon: "trophy",
    tier: 5,
    kind: "lifetime",
  },
  {
    id: "year_of_iron_300",
    title: "Year of iron",
    description: "300 trained days.",
    icon: "award",
    tier: 5,
    kind: "lifetime",
  },
  {
    id: "smelter_1_5m",
    title: "Smelter",
    description: "1,500,000 lb of working volume.",
    icon: "zap",
    tier: 5,
    kind: "lifetime",
  },
  {
    id: "volume_blitz_25k",
    title: "Volume blitz",
    description: "25,000 lb of strength volume in any 7-day window.",
    icon: "zap",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "foundry_week_40k",
    title: "Foundry week",
    description: "40,000 lb of strength volume in any 7-day window.",
    icon: "zap",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "volume_siege_50k",
    title: "Volume siege",
    description: "50,000 lb of strength volume in any 14-day window.",
    icon: "zap",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "distance_demon_10",
    title: "Distance demon",
    description: "10 miles of running in any 7-day window.",
    icon: "footprints",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "pr_spark_3",
    title: "PR spark",
    description: "3 true PRs in any 7-day window.",
    icon: "trophy",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
    retired: true,
  },
  {
    id: "iron_fortnight_10",
    title: "Iron fortnight",
    description: "10 trained days in any 14-day window. Rest does not fill the bar.",
    icon: "calendar",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "pr_weather_5",
    title: "PR weather",
    description: "5 true PRs in any 14-day window.",
    icon: "trophy",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
    retired: true,
  },
  {
    id: "road_fever_25",
    title: "Road fever",
    description: "25 miles of running in any 14-day window.",
    icon: "heart",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
    retired: true,
  },
  {
    id: "return_fire",
    title: "Return fire",
    description: "True PR within 14 days after at least 21 consecutive untrained days.",
    icon: "sparkles",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "hybrid_month",
    title: "Hybrid month",
    description: "20,000 lb strength volume and 60 minutes of cardio in the same 30-day window.",
    icon: "zap",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 30 },
  },
  {
    id: "iron_month_20",
    title: "Iron month",
    description: "20 trained days in any 30-day window. Rest does not fill the bar.",
    icon: "calendar",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 30 },
  },
  {
    id: "road_siege_50",
    title: "Road siege",
    description: "50 miles of running in any 30-day window. Walk miles do not count.",
    icon: "heart",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 30 },
    retired: true,
  },
  {
    id: "pr_monsoon_8",
    title: "PR monsoon",
    description: "8 true PRs in any 21-day window.",
    icon: "trophy",
    tier: 3,
    kind: "challenge",
    window: { unit: "day", length: 21 },
    retired: true,
  },
  {
    id: "hybrid_siege",
    title: "Hybrid siege",
    description: "40,000 lb strength volume and 2 hours of cardio in the same 30-day window.",
    icon: "zap",
    tier: 3,
    kind: "challenge",
    window: { unit: "day", length: 30 },
  },
  {
    id: "rep_siege_500",
    title: "Rep siege",
    description: "500 calisthenics reps in any 7-day window.",
    icon: "repeat",
    tier: 3,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "anvil_month_120k",
    title: "Anvil month",
    description: "120,000 lb of strength volume in any 30-day window.",
    icon: "zap",
    tier: 4,
    kind: "challenge",
    window: { unit: "day", length: 30 },
  },
  {
    id: "odyssey_75",
    title: "Odyssey",
    description: "75 miles of running in any 30-day window. Walk miles do not count.",
    icon: "footprints",
    tier: 4,
    kind: "challenge",
    window: { unit: "day", length: 30 },
  },
  {
    id: "unbroken_21",
    title: "Unbroken",
    description: "21 consecutive trained days. A rest day breaks the chain.",
    icon: "shield",
    tier: 4,
    kind: "challenge",
    window: { unit: "day", length: 21 },
  },
  {
    id: "true_tempest_12",
    title: "True tempest",
    description: "12 true PRs in any 30-day window.",
    icon: "trophy",
    tier: 5,
    kind: "challenge",
    window: { unit: "day", length: 30 },
    retired: true,
  },
  {
    id: "ultramarathon_week_40",
    title: "Ultramarathon week",
    description: "40 miles of running in any 7-day window. Walk miles do not count.",
    icon: "footprints",
    tier: 5,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "sidewalk_stroll_10",
    title: "Sidewalk stroll",
    description: "10 miles of walking in any 14-day window. Run and hike miles do not count.",
    icon: "footprints",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "spin_spark_25",
    title: "Spin spark",
    description: "25 miles of biking in any 7-day window.",
    icon: "bike",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "stair_spark_3k",
    title: "Stair spark",
    description: "3,000 stair steps in any 7-day window.",
    icon: "stairs",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
    retired: true,
  },
  {
    id: "plank_pulse_5",
    title: "Plank pulse",
    description: "5 minutes of plank holds in any 7-day window.",
    icon: "timer",
    tier: 1,
    kind: "challenge",
    window: { unit: "day", length: 7 },
    retired: true,
  },
  {
    id: "footwork_40",
    title: "Footwork",
    description: "40 miles on foot (run, walk, or hike) in any 14-day window.",
    icon: "footprints",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "ridge_day_8",
    title: "Ridge day",
    description: "8 miles of hiking in any 14-day window.",
    icon: "mountain",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 14 },
  },
  {
    id: "pushup_week_150",
    title: "Push-up week",
    description: "150 push-up reps in any 7-day window.",
    icon: "person",
    tier: 2,
    kind: "challenge",
    window: { unit: "day", length: 7 },
  },
  {
    id: "ground_game_100",
    title: "Ground game",
    description: "100 career miles on foot (run, walk, or hike).",
    icon: "footprints",
    tier: 4,
    kind: "lifetime",
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
    id: "later_head_to_head",
    title: "Head to head",
    hook: "Beat a friend on a weekly board.",
    when: "Leaderboards can name a head-to-head week.",
  },
  {
    id: "later_goal_setter",
    title: "Goal setter",
    hook: "Create your first custom challenge.",
    when: "Custom challenges / goals feature ships (MapMyWalk-style). Meta medal only — never one medal per user goal.",
  },
  {
    id: "later_goal_keeper",
    title: "Goal keeper",
    hook: "Complete several custom challenges.",
    when: "After custom goals exist; award on N completions for retention, not unique goal titles.",
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENT_CATALOG.map((item) => [item.id, item])
);

/** Live browse list: full catalog minus unearned retired medals. */
export function browseAchievementCatalog(earned?: EarnedMap): AchievementDef[] {
  return ACHIEVEMENT_CATALOG.filter((def) => !def.retired || Boolean(earned?.[def.id]));
}

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

function exerciseBestValue(ex: Day["exercises"][number]): number {
  if (ex.modality === "strength" && ex.strengthSets?.length) return maxWorkingWeight(ex.strengthSets);
  if (ex.modality === "calisthenics" && ex.calisthenicsSets?.length) {
    return Math.max(...ex.calisthenicsSets.map((set) => set.reps || 0));
  }
  if (ex.modality === "cardio" && ex.cardioData) {
    return ex.cardioData.distance || ex.cardioData.duration || 0;
  }
  return 0;
}

function countTruePrs(days: Day[]): number {
  const series = new Map<string, number[]>();
  const ordered = [...trainingDays(days)].sort((a, b) => a.date.localeCompare(b.date));
  ordered.forEach((day) => {
    const seen = new Set<string>();
    day.exercises.forEach((ex) => {
      const id = `${ex.modality}:${ex.exerciseId || ex.name}`;
      if (seen.has(id)) return;
      const value = exerciseBestValue(ex);
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

/** Dates of true PR improvements (not openers), in chronological order. */
function truePrImprovementDates(days: Day[]): string[] {
  const peaks = new Map<string, number>();
  const dates: string[] = [];
  const ordered = [...trainingDays(days)].sort((a, b) => a.date.localeCompare(b.date));
  ordered.forEach((day) => {
    const seen = new Set<string>();
    day.exercises.forEach((ex) => {
      const id = `${ex.modality}:${ex.exerciseId || ex.name}`;
      if (seen.has(id)) return;
      const value = exerciseBestValue(ex);
      if (value <= 0) return;
      seen.add(id);
      const peak = peaks.get(id);
      if (peak === undefined) {
        peaks.set(id, value);
        return;
      }
      if (value > peak) {
        dates.push(day.date);
        peaks.set(id, value);
      }
    });
  });
  return dates;
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

function maxInRollingWindow(byDate: Map<string, number>, windowDays: number): number {
  if (byDate.size === 0) return 0;
  const dates = Array.from(byDate.keys()).sort();
  let best = 0;
  for (const start of dates) {
    const startMs = parseISO(start).getTime();
    const endMs = startMs + (windowDays - 1) * 86400000;
    let sum = 0;
    dates.forEach((d) => {
      const t = parseISO(d).getTime();
      if (t >= startMs && t <= endMs) sum += byDate.get(d) || 0;
    });
    best = Math.max(best, sum);
  }
  return best;
}

function maxVolumeInRollingDays(days: Day[], windowDays: number): number {
  const trained = trainingDays(days);
  if (trained.length === 0) return 0;
  const byDate = new Map<string, number>();
  trained.forEach((day) => {
    byDate.set(day.date, calculateTotalVolumeFromDays([day]));
  });
  return maxInRollingWindow(byDate, windowDays);
}

function runMilesOnDay(day: Day): number {
  return cardioMilesOnDay(day, (type) => type === "run");
}

function cardioMilesOnDay(
  day: Day,
  match: (type: CardioActivityType) => boolean
): number {
  let miles = 0;
  day.exercises.forEach((ex) => {
    if (ex.modality !== "cardio" || !ex.cardioData) return;
    const type = resolveCardioActivityType(ex.cardioData.activityType, ex.name, ex.exerciseId);
    if (!match(type)) return;
    miles += ex.cardioData.distance || 0;
  });
  return miles;
}

function footMilesOnDay(day: Day): number {
  return cardioMilesOnDay(day, (type) => FOOT_ACTIVITY_TYPES.has(type));
}

function walkMilesOnDay(day: Day): number {
  return cardioMilesOnDay(day, (type) => type === "walk");
}

function hikeMilesOnDay(day: Day): number {
  return cardioMilesOnDay(day, (type) => type === "hike");
}

function bikeMilesOnDay(day: Day): number {
  return cardioMilesOnDay(day, (type) => type === "bike");
}

function stairStepsOnDay(day: Day): number {
  let steps = 0;
  day.exercises.forEach((ex) => {
    if (ex.modality !== "cardio" || !ex.cardioData) return;
    const type = resolveCardioActivityType(ex.cardioData.activityType, ex.name, ex.exerciseId);
    if (type !== "stair") return;
    steps += ex.cardioData.steps || 0;
  });
  return steps;
}

function pushUpRepsOnDay(day: Day): number {
  let reps = 0;
  day.exercises.forEach((ex) => {
    if (ex.modality !== "calisthenics" || !ex.calisthenicsSets?.length) return;
    const text = `${ex.exerciseId || ""} ${ex.name || ""}`;
    if (!PUSH_UP_NAME.test(text)) return;
    reps += ex.calisthenicsSets.reduce((sum, set) => sum + (set.reps || 0), 0);
  });
  return reps;
}

function plankHoldSecondsOnDay(day: Day): number {
  let seconds = 0;
  day.exercises.forEach((ex) => {
    if (ex.modality !== "calisthenics" || !ex.calisthenicsSets?.length) return;
    const text = `${ex.exerciseId || ""} ${ex.name || ""}`;
    if (!PLANK_NAME.test(text)) return;
    seconds += ex.calisthenicsSets.reduce((sum, set) => sum + (set.duration || 0), 0);
  });
  return seconds;
}

function maxMetricInRollingDays(
  days: Day[],
  windowDays: number,
  metricOnDay: (day: Day) => number
): number {
  const byDate = new Map<string, number>();
  trainingDays(days).forEach((day) => {
    const value = metricOnDay(day);
    if (value > 0) byDate.set(day.date, (byDate.get(day.date) || 0) + value);
  });
  return maxInRollingWindow(byDate, windowDays);
}

function maxRunMilesInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, runMilesOnDay);
}

function maxFootMilesInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, footMilesOnDay);
}

function maxWalkMilesInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, walkMilesOnDay);
}

function maxHikeMilesInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, hikeMilesOnDay);
}

function maxBikeMilesInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, bikeMilesOnDay);
}

function maxStairStepsInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, stairStepsOnDay);
}

function maxPushUpRepsInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, pushUpRepsOnDay);
}

function caliRepsOnDay(day: Day): number {
  return day.exercises.reduce((sum, ex) => {
    if (ex.modality !== "calisthenics" || !ex.calisthenicsSets?.length) return sum;
    return sum + ex.calisthenicsSets.reduce((r, set) => r + (set.reps || 0), 0);
  }, 0);
}

function maxCaliRepsInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, caliRepsOnDay);
}

function maxPlankHoldSecondsInRollingDays(days: Day[], windowDays: number): number {
  return maxMetricInRollingDays(days, windowDays, plankHoldSecondsOnDay);
}

/** Lifetime run miles only — never walk. */
function totalRunMiles(days: Day[]): number {
  return trainingDays(days).reduce((sum, day) => sum + runMilesOnDay(day), 0);
}

function totalFootMiles(days: Day[]): number {
  return trainingDays(days).reduce((sum, day) => sum + footMilesOnDay(day), 0);
}

function maxTruePrsInRollingDays(days: Day[], windowDays: number): number {
  const improvementDates = truePrImprovementDates(days);
  if (improvementDates.length === 0) return 0;
  const byDate = new Map<string, number>();
  improvementDates.forEach((date) => {
    byDate.set(date, (byDate.get(date) || 0) + 1);
  });
  return maxInRollingWindow(byDate, windowDays);
}

/** True when any lift beats a prior best that stood at least `minStandDays`. */
function hasStaleKill(days: Day[], minStandDays: number): boolean {
  const peaks = new Map<string, { value: number; date: string }>();
  const ordered = [...trainingDays(days)].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of ordered) {
    const seen = new Set<string>();
    for (const ex of day.exercises) {
      const id = `${ex.modality}:${ex.exerciseId || ex.name}`;
      if (seen.has(id)) continue;
      const value = exerciseBestValue(ex);
      if (value <= 0) continue;
      seen.add(id);
      const peak = peaks.get(id);
      if (!peak) {
        peaks.set(id, { value, date: day.date });
        continue;
      }
      if (value > peak.value) {
        const stood = Math.round(
          (parseISO(day.date).getTime() - parseISO(peak.date).getTime()) / 86400000
        );
        if (stood >= minStandDays) return true;
        peaks.set(id, { value, date: day.date });
      }
    }
  }
  return false;
}

/**
 * True PR within `returnWindowDays` of resuming after a gap of at least
 * `gapDays` consecutive untrained calendar days.
 */
function hasReturnFire(days: Day[], gapDays: number, returnWindowDays: number): boolean {
  const trainedDates = Array.from(new Set(trainingDays(days).map((d) => d.date))).sort();
  if (trainedDates.length < 2) return false;
  const prDates = new Set(truePrImprovementDates(days));
  for (let i = 1; i < trainedDates.length; i++) {
    const prev = parseISO(trainedDates[i - 1]).getTime();
    const curr = parseISO(trainedDates[i]).getTime();
    const gap = Math.round((curr - prev) / 86400000) - 1;
    if (gap < gapDays) continue;
    const resume = trainedDates[i];
    const resumeMs = parseISO(resume).getTime();
    const windowEnd = resumeMs + (returnWindowDays - 1) * 86400000;
    for (const prDate of prDates) {
      const t = parseISO(prDate).getTime();
      if (t >= resumeMs && t <= windowEnd) return true;
    }
  }
  return false;
}

/** True PR on a lift already logged on at least `minPriorDays` distinct trained days. */
function hasSameFight(days: Day[], minPriorDays: number): boolean {
  const priorDates = new Map<string, Set<string>>();
  const peaks = new Map<string, number>();
  const ordered = [...trainingDays(days)].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of ordered) {
    const seen = new Set<string>();
    for (const ex of day.exercises) {
      const id = `${ex.modality}:${ex.exerciseId || ex.name}`;
      if (seen.has(id)) continue;
      const value = exerciseBestValue(ex);
      if (value <= 0) continue;
      seen.add(id);
      const dates = priorDates.get(id) ?? new Set<string>();
      const peak = peaks.get(id);
      if (peak !== undefined && value > peak && dates.size >= minPriorDays) {
        return true;
      }
      if (peak === undefined || value > peak) {
        peaks.set(id, value);
      }
      dates.add(day.date);
      priorDates.set(id, dates);
    }
  }
  return false;
}

/** Max count of distinct trained days (exercises present; rest excluded) in any rolling window. */
function maxTrainedDaysInRollingDays(days: Day[], windowDays: number): number {
  const dates = Array.from(new Set(trainingDays(days).map((day) => day.date))).sort();
  if (dates.length === 0) return 0;
  const byDate = new Map<string, number>();
  dates.forEach((date) => byDate.set(date, 1));
  return maxInRollingWindow(byDate, windowDays);
}

/** Longest run of consecutive calendar days that are all trained — rest or gap breaks. */
function longestConsecutiveTrainedDays(days: Day[]): number {
  const dates = Array.from(new Set(trainingDays(days).map((day) => day.date))).sort();
  if (dates.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = parseISO(dates[i - 1]).getTime();
    const curr = parseISO(dates[i]).getTime();
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

/**
 * Best dual progress in any rolling window: each floor contributes 0 or 1 only when met.
 * Never returns a near-2 float that UI would round to "2 / 2" while still locked.
 */
function maxHybridDualProgressInRollingDays(
  days: Day[],
  windowDays: number,
  volumeFloor: number,
  cardioSecondsFloor: number
): number {
  const volumeByDate = new Map<string, number>();
  const cardioByDate = new Map<string, number>();
  trainingDays(days).forEach((day) => {
    const vol = calculateTotalVolumeFromDays([day]);
    const cardio = calculateTotalCardioDurationFromDays([day]);
    if (vol > 0) volumeByDate.set(day.date, vol);
    if (cardio > 0) cardioByDate.set(day.date, cardio);
  });
  if (volumeByDate.size === 0 && cardioByDate.size === 0) return 0;

  const dates = Array.from(new Set([...volumeByDate.keys(), ...cardioByDate.keys()])).sort();
  let best = 0;
  for (const start of dates) {
    const startMs = parseISO(start).getTime();
    const endMs = startMs + (windowDays - 1) * 86400000;
    let vol = 0;
    let cardio = 0;
    dates.forEach((d) => {
      const t = parseISO(d).getTime();
      if (t < startMs || t > endMs) return;
      vol += volumeByDate.get(d) || 0;
      cardio += cardioByDate.get(d) || 0;
    });
    const goals = (vol >= volumeFloor ? 1 : 0) + (cardio >= cardioSecondsFloor ? 1 : 0);
    best = Math.max(best, goals);
  }
  return best;
}

export function evaluateEarnedIds(days: Day[]): string[] {
  const trained = trainingDays(days);
  const restDays = days.filter((day) => day.isRestDay && day.status !== "injured").length;
  const longest = calculateLongestStreakFromDays(days);
  const volume = calculateTotalVolumeFromDays(days);
  const truePrs = countTruePrs(days);
  const trainedWeeks = trained.map((day) => isoWeekKey(day.date));
  const blitz = maxVolumeInRollingDays(days, 7);
  const foundry = blitz;
  const siege = maxVolumeInRollingDays(days, 14);
  const anvil = maxVolumeInRollingDays(days, 30);
  const runMiles7 = maxRunMilesInRollingDays(days, 7);
  const runMiles14 = maxRunMilesInRollingDays(days, 14);
  const runMiles30 = maxRunMilesInRollingDays(days, 30);
  const footMiles14 = maxFootMilesInRollingDays(days, 14);
  const walkMiles14 = maxWalkMilesInRollingDays(days, 14);
  const hikeMiles14 = maxHikeMilesInRollingDays(days, 14);
  const bikeMiles7 = maxBikeMilesInRollingDays(days, 7);
  const stairSteps7 = maxStairStepsInRollingDays(days, 7);
  const pushUpReps7 = maxPushUpRepsInRollingDays(days, 7);
  const caliReps7 = maxCaliRepsInRollingDays(days, 7);
  const plankSeconds7 = maxPlankHoldSecondsInRollingDays(days, 7);
  const prSpark = maxTruePrsInRollingDays(days, 7);
  const ironFortnight = maxTrainedDaysInRollingDays(days, 14);
  const ironMonth = maxTrainedDaysInRollingDays(days, 30);
  const prWeather = maxTruePrsInRollingDays(days, 14);
  const prMonsoon = maxTruePrsInRollingDays(days, 21);
  const prTempest = maxTruePrsInRollingDays(days, 30);
  const hybridMonth = maxHybridDualProgressInRollingDays(days, 30, 20_000, 3600);
  const hybridSiege = maxHybridDualProgressInRollingDays(days, 30, 40_000, 2 * 3600);
  const unbroken = longestConsecutiveTrainedDays(days);
  const earned: string[] = [];

  if (truePrs >= 1) earned.push("true_pr");
  if (weeksWithMinSessions(days, 3) >= 4) earned.push("rhythm_4");
  if (uniqueExerciseIds(days).size >= 12) earned.push("toolbox");
  if (hasHybridWeek(days)) earned.push("hybrid_week");
  if (restDays >= 8) earned.push("rest_steward");
  if (blitz >= 25_000) earned.push("volume_blitz_25k");
  if (foundry >= 40_000) earned.push("foundry_week_40k");
  if (siege >= 50_000) earned.push("volume_siege_50k");
  if (runMiles7 >= 10) earned.push("distance_demon_10");
  if (prSpark >= 3) earned.push("pr_spark_3");
  if (ironFortnight >= 10) earned.push("iron_fortnight_10");
  if (prWeather >= 5) earned.push("pr_weather_5");
  if (runMiles14 >= 25) earned.push("road_fever_25");
  if (hasReturnFire(days, 21, 14)) earned.push("return_fire");
  if (hybridMonth >= 2) earned.push("hybrid_month");
  if (ironMonth >= 20) earned.push("iron_month_20");
  if (runMiles30 >= 50) earned.push("road_siege_50");
  if (prMonsoon >= 8) earned.push("pr_monsoon_8");
  if (hybridSiege >= 2) earned.push("hybrid_siege");
  if (caliReps7 >= 500) earned.push("rep_siege_500");
  if (anvil >= 120_000) earned.push("anvil_month_120k");
  if (runMiles30 >= 75) earned.push("odyssey_75");
  if (unbroken >= 21) earned.push("unbroken_21");
  if (prTempest >= 12) earned.push("true_tempest_12");
  if (runMiles7 >= 40) earned.push("ultramarathon_week_40");
  if (walkMiles14 >= 10) earned.push("sidewalk_stroll_10");
  if (bikeMiles7 >= 25) earned.push("spin_spark_25");
  if (stairSteps7 >= 3000) earned.push("stair_spark_3k");
  if (plankSeconds7 >= 5 * 60) earned.push("plank_pulse_5");
  if (footMiles14 >= 40) earned.push("footwork_40");
  if (hikeMiles14 >= 8) earned.push("ridge_day_8");
  if (pushUpReps7 >= 150) earned.push("pushup_week_150");
  if (longest >= 7) earned.push("streak_7");
  if (longestConsecutiveWeeks(trainedWeeks) >= 8) earned.push("week_streak_8");
  if (truePrs >= 5) earned.push("pr_repeat");
  if (hasSameFight(days, 8)) earned.push("same_fight");
  if (hasStaleKill(days, 90)) earned.push("stale_kill_90");
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
  // Soft-retired ladder floors stay in catalog for history only — do not push here.
  if (calculateTotalCardioDurationFromDays(days) >= 30 * 3600) earned.push("engine_30");
  if (longest >= 90) earned.push("streak_90");
  if (weeksWithMinSessions(days, 3) >= 26) earned.push("rhythm_26");
  if (trained.length >= 200) earned.push("evergreen_200");
  if (longest >= 60) earned.push("two_moons_60");
  if (totalRunMiles(days) >= 100) earned.push("mileage_club_100");
  if (totalFootMiles(days) >= 100) earned.push("ground_game_100");
  if (calculateTotalCardioDurationFromDays(days) >= 50 * 3600) earned.push("long_haul_50");
  if (truePrs >= 50) earned.push("true_dynasty_50");
  if (trained.length >= 300) earned.push("year_of_iron_300");
  if (volume >= 1_500_000) earned.push("smelter_1_5m");
  return earned.filter((id) => !ACHIEVEMENT_BY_ID[id]?.retired);
}

export type AchievementProgressMetric = {
  current: number;
  target: number;
  /** How to show the numbers in UI (default plain integers). */
  unit?: "count" | "hours" | "volume" | "dual" | "miles";
};

export function achievementTierLabel(tier: 1 | 2 | 3 | 4 | 5): string {
  if (tier === 1) return "Bronze";
  if (tier === 2) return "Silver";
  if (tier === 3) return "Gold";
  if (tier === 4) return "Platinum";
  return "Diamond";
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
  const blitz = maxVolumeInRollingDays(days, 7);
  const siege = maxVolumeInRollingDays(days, 14);
  const anvil = maxVolumeInRollingDays(days, 30);
  const runMiles7 = maxRunMilesInRollingDays(days, 7);
  const runMiles14 = maxRunMilesInRollingDays(days, 14);
  const runMiles30 = maxRunMilesInRollingDays(days, 30);
  const footMiles14 = maxFootMilesInRollingDays(days, 14);
  const walkMiles14 = maxWalkMilesInRollingDays(days, 14);
  const hikeMiles14 = maxHikeMilesInRollingDays(days, 14);
  const bikeMiles7 = maxBikeMilesInRollingDays(days, 7);
  const stairSteps7 = maxStairStepsInRollingDays(days, 7);
  const pushUpReps7 = maxPushUpRepsInRollingDays(days, 7);
  const caliReps7 = maxCaliRepsInRollingDays(days, 7);
  const plankSeconds7 = maxPlankHoldSecondsInRollingDays(days, 7);
  const prSpark = maxTruePrsInRollingDays(days, 7);
  const ironFortnight = maxTrainedDaysInRollingDays(days, 14);
  const ironMonth = maxTrainedDaysInRollingDays(days, 30);
  const prWeather = maxTruePrsInRollingDays(days, 14);
  const prMonsoon = maxTruePrsInRollingDays(days, 21);
  const prTempest = maxTruePrsInRollingDays(days, 30);
  const hybridMonth = maxHybridDualProgressInRollingDays(days, 30, 20_000, 3600);
  const hybridSiege = maxHybridDualProgressInRollingDays(days, 30, 40_000, 2 * 3600);
  const unbroken = longestConsecutiveTrainedDays(days);
  const lifetimeRunMiles = totalRunMiles(days);
  const lifetimeFootMiles = totalFootMiles(days);
  const staleKill = hasStaleKill(days, 90) ? 1 : 0;
  const sameFight = hasSameFight(days, 8) ? 1 : 0;
  const returnFire = hasReturnFire(days, 21, 14) ? 1 : 0;

  const progress: Record<string, AchievementProgressMetric> = {
    true_pr: { current: Math.min(truePrs, 1), target: 1 },
    rhythm_4: { current: Math.min(rhythmWeeks, 4), target: 4 },
    toolbox: { current: Math.min(exercises, 12), target: 12 },
    hybrid_week: { current: hybrid, target: 1 },
    rest_steward: { current: Math.min(restDays, 8), target: 8 },
    volume_blitz_25k: { current: Math.min(blitz, 25_000), target: 25_000, unit: "volume" },
    foundry_week_40k: { current: Math.min(blitz, 40_000), target: 40_000, unit: "volume" },
    volume_siege_50k: { current: Math.min(siege, 50_000), target: 50_000, unit: "volume" },
    distance_demon_10: { current: Math.min(runMiles7, 10), target: 10, unit: "miles" },
    pr_spark_3: { current: Math.min(prSpark, 3), target: 3 },
    iron_fortnight_10: { current: Math.min(ironFortnight, 10), target: 10 },
    pr_weather_5: { current: Math.min(prWeather, 5), target: 5 },
    road_fever_25: { current: Math.min(runMiles14, 25), target: 25, unit: "miles" },
    return_fire: { current: returnFire, target: 1 },
    hybrid_month: { current: Math.min(hybridMonth, 2), target: 2, unit: "dual" },
    iron_month_20: { current: Math.min(ironMonth, 20), target: 20 },
    road_siege_50: { current: Math.min(runMiles30, 50), target: 50, unit: "miles" },
    pr_monsoon_8: { current: Math.min(prMonsoon, 8), target: 8 },
    hybrid_siege: { current: Math.min(hybridSiege, 2), target: 2, unit: "dual" },
    rep_siege_500: { current: Math.min(caliReps7, 500), target: 500 },
    anvil_month_120k: { current: Math.min(anvil, 120_000), target: 120_000, unit: "volume" },
    odyssey_75: { current: Math.min(runMiles30, 75), target: 75, unit: "miles" },
    unbroken_21: { current: Math.min(unbroken, 21), target: 21 },
    true_tempest_12: { current: Math.min(prTempest, 12), target: 12 },
    ultramarathon_week_40: { current: Math.min(runMiles7, 40), target: 40, unit: "miles" },
    sidewalk_stroll_10: { current: Math.min(walkMiles14, 10), target: 10, unit: "miles" },
    spin_spark_25: { current: Math.min(bikeMiles7, 25), target: 25, unit: "miles" },
    stair_spark_3k: { current: Math.min(stairSteps7, 3000), target: 3000 },
    plank_pulse_5: {
      current: Math.min(Math.floor(plankSeconds7 / 60), 5),
      target: 5,
    },
    footwork_40: { current: Math.min(footMiles14, 40), target: 40, unit: "miles" },
    ridge_day_8: { current: Math.min(hikeMiles14, 8), target: 8, unit: "miles" },
    pushup_week_150: { current: Math.min(pushUpReps7, 150), target: 150 },
    streak_7: { current: Math.min(longest, 7), target: 7 },
    week_streak_8: { current: Math.min(weekStreak, 8), target: 8 },
    pr_repeat: { current: Math.min(truePrs, 5), target: 5 },
    same_fight: { current: sameFight, target: 1 },
    stale_kill_90: { current: staleKill, target: 1 },
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
    sessions_250: { current: Math.min(trained.length, 250), target: 250 },
    volume_2_5m: { current: Math.min(volume, 2_500_000), target: 2_500_000, unit: "volume" },
    engine_30: {
      current: Math.min(cardioSeconds, 30 * 3600),
      target: 30 * 3600,
      unit: "hours",
    },
    streak_90: { current: Math.min(longest, 90), target: 90 },
    rhythm_26: { current: Math.min(rhythmWeeks, 26), target: 26 },
    evergreen_200: { current: Math.min(trained.length, 200), target: 200 },
    two_moons_60: { current: Math.min(longest, 60), target: 60 },
    mileage_club_100: { current: Math.min(lifetimeRunMiles, 100), target: 100, unit: "miles" },
    ground_game_100: { current: Math.min(lifetimeFootMiles, 100), target: 100, unit: "miles" },
    long_haul_50: {
      current: Math.min(cardioSeconds, 50 * 3600),
      target: 50 * 3600,
      unit: "hours",
    },
    true_dynasty_50: { current: Math.min(truePrs, 50), target: 50 },
    year_of_iron_300: { current: Math.min(trained.length, 300), target: 300 },
    smelter_1_5m: { current: Math.min(volume, 1_500_000), target: 1_500_000, unit: "volume" },
  };
  return progress;
}

/**
 * Unearned challenge medals closest to completion first.
 * Skips binary event challenges (e.g. Return fire) — they have no honest rolling bar.
 * Returns def + progress metric + window length (days).
 */
export function getActiveChallenges(
  days: Day[],
  earned: EarnedMap,
  limit = 5
): Array<{ def: AchievementDef; metric: AchievementProgressMetric; windowDays: number }> {
  const progress = getAchievementProgress(days);
  return ACHIEVEMENT_CATALOG.filter(
    (def) =>
      def.kind === "challenge" &&
      def.window &&
      !def.retired &&
      !earned[def.id] &&
      progress[def.id]
  )
    .map((def) => ({
      def,
      metric: progress[def.id]!,
      windowDays: def.window!.length,
    }))
    // Event unlocks (0/1 with no unit) look like a fake rolling window on the Active strip.
    .filter(({ metric }) => !(metric.target === 1 && metric.unit == null))
    .sort((a, b) => {
      const ratioA = a.metric.target > 0 ? a.metric.current / a.metric.target : 0;
      const ratioB = b.metric.target > 0 ? b.metric.current / b.metric.target : 0;
      return ratioB - ratioA;
    })
    .slice(0, limit);
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
  if (metric.unit === "dual") {
    return `${Math.floor(metric.current)} / ${metric.target} goals`;
  }
  if (metric.unit === "miles") {
    const fmt = (n: number) =>
      Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
    return `${fmt(metric.current)} / ${fmt(metric.target)} mi`;
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
