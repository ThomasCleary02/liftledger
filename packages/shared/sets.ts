import type { StrengthSetEntry } from "./firestore/workouts";

export function isWarmupSet(set: StrengthSetEntry | undefined | null): boolean {
  return Boolean(set?.warmup);
}

export function workingStrengthSets(sets?: StrengthSetEntry[] | null): StrengthSetEntry[] {
  return (sets || []).filter((set) => !isWarmupSet(set));
}

export function strengthVolume(sets?: StrengthSetEntry[] | null): number {
  return workingStrengthSets(sets).reduce((sum, set) => sum + (set.reps || 0) * (set.weight || 0), 0);
}

export function maxWorkingWeight(sets?: StrengthSetEntry[] | null): number {
  return workingStrengthSets(sets).reduce((max, set) => Math.max(max, set.weight || 0), 0);
}
