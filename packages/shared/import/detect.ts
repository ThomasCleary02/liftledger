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
  return weightUnitFromHeaders(headers) ?? "lb";
}

export function weightUnitFromHeaders(headers: string[]): WeightUnit | undefined {
  for (const header of headers) {
    const unit = headerUnit(header);
    if (unit === "kg" || unit === "lb") return unit;
  }
  const joined = headers.map(normalizeHeader).join(" ");
  if (/\bweight kg\b/.test(joined) || /\bweight_kg\b/.test(joined)) return "kg";
  if (/\bweight lbs?\b/.test(joined) || /\bweight_lbs?\b/.test(joined)) return "lb";
  return undefined;
}

export function guessDistanceUnit(headers: string[]): DistanceUnit {
  return distanceUnitFromHeaders(headers) ?? "mi";
}

export function distanceUnitFromHeaders(headers: string[]): DistanceUnit | undefined {
  for (const header of headers) {
    const unit = headerUnit(header);
    if (unit === "km" || unit === "mi") return unit;
  }
  const joined = headers.map(normalizeHeader).join(" ");
  if (/\bdistance km\b/.test(joined) || /\bdistance_km\b/.test(joined)) return "km";
  if (/\bdistance mi\b/.test(joined) || /\bdistance_mi\b/.test(joined) || /\bdistance miles\b/.test(joined)) {
    return "mi";
  }
  return undefined;
}
