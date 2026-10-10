export const CARDIO_ACTIVITY_TYPES = [
  "run",
  "walk",
  "bike",
  "row",
  "stair",
  "elliptical",
  "swim",
  "hike",
  "other",
] as const;
export type CardioActivityType = (typeof CARDIO_ACTIVITY_TYPES)[number];

export const CARDIO_ACTIVITY_LABELS: Record<CardioActivityType, string> = {
  run: "Run",
  walk: "Walk",
  bike: "Bike",
  row: "Row",
  stair: "Stairs",
  elliptical: "Elliptical",
  swim: "Swim",
  hike: "Hike",
  other: "Other",
};

/** Leaderboard / distance families for comparable cardio. */
export type CardioDistanceFamily = "foot" | "bike" | "row" | "stair";

export const CARDIO_DISTANCE_FAMILIES = ["foot", "bike", "row", "stair"] as const;

export const CARDIO_DISTANCE_FAMILY_LABELS: Record<CardioDistanceFamily, string> = {
  foot: "Foot distance (run + walk + hike)",
  bike: "Bike distance",
  row: "Row distance",
  stair: "Stairs steps",
};

export function cardioDistanceFamily(type: CardioActivityType): CardioDistanceFamily | null {
  if (type === "run" || type === "walk" || type === "hike") return "foot";
  if (type === "bike") return "bike";
  if (type === "row") return "row";
  if (type === "stair") return "stair";
  return null;
}

export function isCardioActivityType(value: unknown): value is CardioActivityType {
  return typeof value === "string" && (CARDIO_ACTIVITY_TYPES as readonly string[]).includes(value);
}

function haystack(name?: string, exerciseId?: string): string {
  return `${exerciseId || ""} ${name || ""}`.toLowerCase().replace(/[_-]+/g, " ");
}

/**
 * Infer a gym-friendly activity kind from the exercise name.
 * Old logs have no activityType, so analytics use this as the fallback.
 */
export function inferCardioActivityType(name?: string, exerciseId?: string): CardioActivityType {
  const text = haystack(name, exerciseId);

  if (/(stair|stepper|step\s*master|stairmaster|jacob'?s?\s*ladder)/.test(text)) return "stair";
  if (/\btreadmill\b/.test(text) && /\bwalk/.test(text)) return "walk";
  if (/(treadmill|\brun\b|\brunning\b|jog|jogging|sprint)/.test(text)) return "run";
  if (/(hike|hiking|ruck)/.test(text)) return "hike";
  if (/(walk)/.test(text)) return "walk";
  if (/(row|rowing|\berg\b|concept 2)/.test(text)) return "row";
  if (/(bike|biking|cycl|spin|peloton)/.test(text)) return "bike";
  if (/(elliptical|cross[\s-]?trainer|arc\s*trainer)/.test(text)) return "elliptical";
  if (/(swim|swimming|pool)/.test(text)) return "swim";
  return "other";
}

export function resolveCardioActivityType(
  activityType: unknown,
  name?: string,
  exerciseId?: string
): CardioActivityType {
  if (isCardioActivityType(activityType)) return activityType;
  return inferCardioActivityType(name, exerciseId);
}

/** True when the activity is logged by step count rather than distance. */
export function isStepsFocusedCardio(
  activityType: unknown,
  name?: string,
  exerciseId?: string
): boolean {
  return resolveCardioActivityType(activityType, name, exerciseId) === "stair";
}

/** Run/walk/hike use pace. Bike uses speed. Others stay time + optional secondary. */
export function cardioPaceKind(
  type: CardioActivityType
): "pace" | "speed" | "none" {
  if (type === "run" || type === "walk" || type === "hike") return "pace";
  if (type === "bike") return "speed";
  return "none";
}

export function secondsPerMile(durationSeconds: number, distanceMiles: number): number | undefined {
  if (!(durationSeconds > 0) || !(distanceMiles > 0)) return undefined;
  return durationSeconds / distanceMiles;
}

export function milesPerHour(durationSeconds: number, distanceMiles: number): number | undefined {
  if (!(durationSeconds > 0) || !(distanceMiles > 0)) return undefined;
  return distanceMiles / (durationSeconds / 3600);
}
