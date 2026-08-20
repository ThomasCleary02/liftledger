import { headerUnit, normalizeHeader } from "./csv";
import type { DetectedFormat, DistanceUnit, WeightUnit } from "./types";

export function detectFormat(headers: string[]): DetectedFormat {
  const n = headers.map(normalizeHeader);
  const has = (name: string) => n.includes(name);
  if (has("restday") || (has("modality") && has("exercise") && has("date"))) return "liftledger";
  if (has("exercise name") && (has("set order") || has("workout name"))) return "strong";
  if (has("exercise title") || has("weight kg") || has("start time")) return "hevy";
  return "unknown";
}

export function guessWeightUnit(headers: string[]): WeightUnit {
  for (const header of headers) {
    const unit = headerUnit(header);
    if (unit === "kg" || unit === "lb") return unit;
  }
  const joined = headers.map(normalizeHeader).join(" ");
  if (joined.includes("weight kg") || joined.includes("kg")) return "kg";
  return "lb";
}

export function guessDistanceUnit(headers: string[]): DistanceUnit {
  for (const header of headers) {
    const unit = headerUnit(header);
    if (unit === "km" || unit === "mi") return unit;
  }
  const joined = headers.map(normalizeHeader).join(" ");
  if (joined.includes("km")) return "km";
  return "mi";
}
