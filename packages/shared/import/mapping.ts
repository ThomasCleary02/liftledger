import { normalizeHeader } from "./csv";
import { guessDistanceUnit, guessWeightUnit } from "./detect";
import type { ColumnMapping } from "./types";

function findHeader(headers: string[], aliases: string[]): string | undefined {
  const wants = aliases.map(normalizeHeader);
  return headers.find((header) => wants.includes(normalizeHeader(header)));
}

export function suggestMapping(headers: string[]): ColumnMapping {
  return {
    date: findHeader(headers, ["date", "start_time", "start time", "workout date"]) || headers[0] || "",
    exercise:
      findHeader(headers, ["exercise", "exercise name", "exercise_title", "exercise title", "name"]) ||
      headers[1] ||
      "",
    reps: findHeader(headers, ["reps", "repetitions"]),
    weight: findHeader(headers, ["weight", "weight_kg", "weight_lb", "weight_lbs", "kg", "lbs"]),
    set: findHeader(headers, ["set", "set order", "set_index", "set index"]),
    duration: findHeader(headers, ["duration", "seconds", "duration_seconds", "duration seconds", "time"]),
    distance: findHeader(headers, ["distance", "distance_km", "distance_mi", "distance_miles"]),
    notes: findHeader(headers, ["notes", "comment", "comments"]),
    weightUnit: guessWeightUnit(headers),
    distanceUnit: guessDistanceUnit(headers),
    durationIsMinutes: false,
  };
}
