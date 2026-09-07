import { format } from "date-fns";
import {
  calculateCurrentStreakFromDays,
  calculateLongestStreakFromDays,
  findAllPRs,
} from "./analytics/calculations";
import type { ExercisePR } from "./analytics/types";
import type { Day } from "./firestore/days";

export type AchievementShareSettings = {
  enabled: boolean;
  showStreak: boolean;
  showPRs: boolean;
  pinnedKeys: string[];
};

export type PublicPR = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  modality: ExercisePR["modality"];
  prType: ExercisePR["prType"];
  value: number;
  date: string;
};

export type PublicAchievements = {
  currentStreak?: number;
  longestStreak?: number;
  prs?: PublicPR[];
  computedAt: string;
};

export const DEFAULT_ACHIEVEMENT_SHARE: AchievementShareSettings = {
  enabled: false,
  showStreak: true,
  showPRs: true,
  pinnedKeys: [],
};

export function parseAchievementShare(raw: unknown): AchievementShareSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ACHIEVEMENT_SHARE };
  const data = raw as Record<string, unknown>;
  return {
    enabled: data.enabled === true,
    showStreak: data.showStreak !== false,
    showPRs: data.showPRs !== false,
    pinnedKeys: Array.isArray(data.pinnedKeys)
      ? data.pinnedKeys.filter((key): key is string => typeof key === "string").slice(0, 5)
      : [],
  };
}

export function achievementKey(exerciseId: string, prType: ExercisePR["prType"]): string {
  return `${exerciseId}:${prType}`;
}

export function prAchievementKey(pr: ExercisePR): string {
  return achievementKey(pr.exerciseId, pr.prType);
}

export function toPublicPR(pr: ExercisePR): PublicPR {
  return {
    key: prAchievementKey(pr),
    exerciseId: pr.exerciseId,
    exerciseName: pr.exerciseName,
    modality: pr.modality,
    prType: pr.prType,
    value: pr.value,
    date: format(pr.date, "yyyy-MM-dd"),
  };
}

export function buildPublicAchievements(
  days: Day[],
  trackedExerciseIds: string[],
  share: AchievementShareSettings
): PublicAchievements | null {
  if (!share.enabled) return null;

  const snapshot: PublicAchievements = {
    computedAt: new Date().toISOString(),
  };

  if (share.showStreak) {
    snapshot.currentStreak = calculateCurrentStreakFromDays(days);
    snapshot.longestStreak = calculateLongestStreakFromDays(days);
  }

  if (share.showPRs) {
    const all = findAllPRs(days, trackedExerciseIds.length > 0 ? trackedExerciseIds : undefined);
    const pinned = new Set(share.pinnedKeys);
    const selected = pinned.size
      ? all.filter((pr) => pinned.has(prAchievementKey(pr)))
      : [...all].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    snapshot.prs = selected.slice(0, 8).map(toPublicPR);
  }

  return snapshot;
}
