import { headerUnit, parseDateCell, parseNumber, pick } from "./csv";
import { guessDistanceUnit, guessWeightUnit } from "./detect";
import type { ImportPreview, ImportRow, WeightUnit, DistanceUnit } from "./types";
import { toStoredDistance, toStoredWeight } from "../utils/units";

export function recordsToRows(
  records: Record<string, string>[],
  getRow: (record: Record<string, string>, units: { weight: WeightUnit; distance: DistanceUnit }) => ImportRow | null,
  headers: string[],
  format: ImportPreview["format"],
  overrides?: { weightUnit?: WeightUnit; distanceUnit?: DistanceUnit }
): ImportPreview {
  const weightUnit = overrides?.weightUnit ?? guessWeightUnit(headers);
  const distanceUnit = overrides?.distanceUnit ?? guessDistanceUnit(headers);
  const warnings: string[] = [];
  const rows: ImportRow[] = [];
  for (const record of records) {
    const row = getRow(record, { weight: weightUnit, distance: distanceUnit });
    if (row) rows.push(row);
  }
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const days = new Set(rows.map((row) => row.date));
  if (rows.length === 0) warnings.push("No sets found in this file.");
  return {
    format,
    headers,
    rows,
    dayCount: days.size,
    setCount: rows.length,
    dateMin: dates[0],
    dateMax: dates[dates.length - 1],
    sample: rows.slice(0, 5),
    weightUnitGuess: weightUnit,
    distanceUnitGuess: distanceUnit,
    warnings,
  };
}

export function weightToLbs(value: number | undefined, unit: WeightUnit): number | undefined {
  if (value == null) return undefined;
  return toStoredWeight(value, unit === "kg" ? "metric" : "imperial");
}

export function distanceToMiles(value: number | undefined, unit: DistanceUnit): number | undefined {
  if (value == null) return undefined;
  return toStoredDistance(value, unit === "km" ? "metric" : "imperial");
}

export function durationSeconds(value: number | undefined, minutes: boolean): number | undefined {
  if (value == null) return undefined;
  return minutes ? Math.round(value * 60) : Math.round(value);
}

export function parseStrongLike(
  record: Record<string, string>,
  units: { weight: WeightUnit; distance: DistanceUnit }
): ImportRow | null {
  const date = parseDateCell(pick(record, ["Date", "start_time", "Start Time", "Workout Date"]));
  const exerciseName = pick(record, ["Exercise Name", "exercise_title", "Exercise", "exercise"]);
  if (!date || !exerciseName) return null;
  const setIndex = Math.max(1, Math.round(parseNumber(pick(record, ["Set Order", "set_index", "Set", "set"])) || 1));
  const headerKeys = Object.keys(record);
  const weightHeader = headerKeys.find((key) => normalizeMatch(key, ["weight", "weight kg", "weight lb", "weight lbs"]));
  const weightUnit = (weightHeader && headerUnit(weightHeader)) || (pick(record, ["weight_kg"]) ? "kg" : units.weight);
  const weightRaw = parseNumber(pick(record, ["Weight", "weight_kg", "weight_lbs", "weight"]));
  const distHeader = headerKeys.find((key) => normalizeMatch(key, ["distance", "distance km", "distance mi"]));
  const distanceUnit = (distHeader && headerUnit(distHeader)) || (pick(record, ["distance_km"]) ? "km" : units.distance);
  const distanceRaw = parseNumber(pick(record, ["Distance", "distance_km", "distance_miles", "distance"]));
  const seconds = parseNumber(pick(record, ["Seconds", "duration_seconds", "Duration Seconds"]));
  const durationClock = pick(record, ["Duration"]);
  const durationFromClock = parseClock(durationClock);
  const notes = pick(record, ["Notes", "exercise_notes", "Set Notes"]) || undefined;
  const rpe = pick(record, ["RPE", "rpe"]);
  const workoutName = pick(record, ["Workout Name", "title", "Title"]) || undefined;
  const combinedNotes = [notes, rpe ? `RPE ${rpe}` : ""].filter(Boolean).join(" · ") || undefined;
  return {
    date,
    exerciseName,
    setIndex,
    reps: parseNumber(pick(record, ["Reps", "reps"])),
    weightLbs: weightToLbs(weightRaw, weightUnit === "kg" ? "kg" : "lb"),
    durationSeconds: seconds ?? durationFromClock,
    distanceMiles: distanceToMiles(distanceRaw, distanceUnit === "km" ? "km" : "mi"),
    notes: combinedNotes,
    workoutName,
  };
}

function normalizeMatch(header: string, aliases: string[]): boolean {
  const n = header.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
  const stripped = n.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return aliases.includes(n) || aliases.includes(stripped);
}

function parseClock(value: string): number | undefined {
  if (!value) return undefined;
  const hms = value.trim().match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (!hms) return undefined;
  const hours = Number(hms[1]);
  const minutes = Number(hms[2]);
  const seconds = hms[3] ? Number(hms[3]) : 0;
  if (hms[3]) return hours * 3600 + minutes * 60 + seconds;
  return hours * 60 + minutes;
}

export { parseNumber, parseDateCell, pick };
