export const CARDIO_ACTIVITY_TYPES = ["run", "walk", "bike", "row", "other"] as const;
export type CardioActivityType = (typeof CARDIO_ACTIVITY_TYPES)[number];

export const CARDIO_ACTIVITY_LABELS: Record<CardioActivityType, string> = {
  run: "Run",
  walk: "Walk",
  bike: "Bike",
  row: "Row",
  other: "Other",
};

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

  // Treadmill walk before generic treadmill→run, so walks aren't labeled as runs.
  if (/\btreadmill\b/.test(text) && /\bwalk/.test(text)) return "walk";
  // Run before walk so ids/names like "easy_run" aren't stolen by a walk substring elsewhere.
  if (/(treadmill|\brun\b|\brunning\b|jog|jogging|sprint)/.test(text)) return "run";
  if (/(walk|hike|hiking|ruck)/.test(text)) return "walk";
  if (/(row|rowing|\berg\b|concept 2)/.test(text)) return "row";
  if (/(bike|biking|cycl|spin|peloton)/.test(text)) return "bike";
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

/** Run/walk use min/mi (or min/km). Bike uses speed. Row and other stay as time + optional distance. */
export function cardioPaceKind(
  type: CardioActivityType
): "pace" | "speed" | "none" {
  if (type === "run" || type === "walk") return "pace";
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
