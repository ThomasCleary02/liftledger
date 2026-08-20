import { parseCsv, parseDateCell, parseNumber, pick, rowsToObjects } from "./csv";
import { detectFormat, guessDistanceUnit, guessWeightUnit } from "./detect";
import { distanceToMiles, durationSeconds, recordsToRows, parseStrongLike, weightToLbs } from "./rows";
import type { ColumnMapping, DetectedFormat, ImportPreview, ImportRow, WeightUnit } from "./types";

export function parseImportFile(
  text: string,
  overrides?: { weightUnit?: WeightUnit; distanceUnit?: ImportPreview["distanceUnitGuess"]; mapping?: ColumnMapping }
): ImportPreview {
  const table = parseCsv(text);
  const { headers, records } = rowsToObjects(table);
  const format: DetectedFormat = overrides?.mapping ? "unknown" : detectFormat(headers);
  if (overrides?.mapping) {
    return parseMapped(records, headers, overrides.mapping);
  }
  if (format === "hevy") {
    return recordsToRows(records, (record, units) => parseHevy(record, units), headers, "hevy", overrides);
  }
  if (format === "liftledger") {
    return parseLiftLedger(records, headers, overrides);
  }
  if (format === "strong") {
    return recordsToRows(records, (record, units) => parseStrongLike(record, units), headers, "strong", overrides);
  }
  return recordsToRows(records, (record, units) => parseStrongLike(record, units), headers, "unknown", overrides);
}

function parseHevy(
  record: Record<string, string>,
  units: { weight: WeightUnit; distance: ImportPreview["distanceUnitGuess"] }
): ImportRow | null {
  const date = parseDateCell(pick(record, ["start_time", "Start Time", "Date"]));
  const exerciseName = pick(record, ["exercise_title", "Exercise Title", "Exercise"]);
  if (!date || !exerciseName) return null;
  const setIndex = Math.max(1, Math.round(parseNumber(pick(record, ["set_index", "Set Index"])) || 1));
  const kg = parseNumber(pick(record, ["weight_kg", "Weight (kg)"]));
  const lbs = parseNumber(pick(record, ["weight_lbs", "Weight (lbs)", "Weight"]));
  const km = parseNumber(pick(record, ["distance_km"]));
  const mi = parseNumber(pick(record, ["distance_miles", "Distance"]));
  return {
    date,
    exerciseName,
    setIndex,
    reps: parseNumber(pick(record, ["reps", "Reps"])),
    weightLbs: kg != null ? weightToLbs(kg, "kg") : weightToLbs(lbs, units.weight),
    durationSeconds: parseNumber(pick(record, ["duration_seconds", "Seconds"])),
    distanceMiles: km != null ? distanceToMiles(km, "km") : distanceToMiles(mi, units.distance),
    notes: [pick(record, ["exercise_notes", "Notes"]), pick(record, ["rpe", "RPE"]) ? `RPE ${pick(record, ["rpe", "RPE"])}` : ""]
      .filter(Boolean)
      .join(" · ") || undefined,
    workoutName: pick(record, ["title", "Title"]) || undefined,
  };
}

function parseLiftLedger(
  records: Record<string, string>[],
  headers: string[],
  overrides?: { weightUnit?: WeightUnit; distanceUnit?: ImportPreview["distanceUnitGuess"] }
): ImportPreview {
  const weightUnit = overrides?.weightUnit ?? guessWeightUnit(headers);
  const distanceUnit = overrides?.distanceUnit ?? guessDistanceUnit(headers);
  return recordsToRows(
    records,
    (record) => {
      const date = parseDateCell(pick(record, ["date"]));
      const rest = pick(record, ["restDay", "restday"]).toLowerCase() === "true";
      const exerciseName = pick(record, ["exercise"]);
      if (!date) return null;
      if (rest && !exerciseName) {
        return { date, exerciseName: "", setIndex: 1, restDay: true };
      }
      if (!exerciseName) return null;
      return {
        date,
        exerciseName,
        setIndex: Math.max(1, Math.round(parseNumber(pick(record, ["set"])) || 1)),
        reps: parseNumber(pick(record, ["reps"])),
        weightLbs: weightToLbs(parseNumber(pick(record, ["weight_lb", "weight_kg", "weight"])), weightUnit),
        durationSeconds: parseNumber(pick(record, ["durationSeconds", "duration"])),
        distanceMiles: distanceToMiles(parseNumber(pick(record, ["distance_mi", "distance_km", "distance"])), distanceUnit),
        notes: pick(record, ["notes"]) || undefined,
        restDay: rest,
      };
    },
    headers,
    "liftledger",
    overrides
  );
}

export function parseMapped(
  records: Record<string, string>[],
  headers: string[],
  mapping: ColumnMapping
): ImportPreview {
  return recordsToRows(
    records,
    (record) => {
      const date = parseDateCell(record[mapping.date] || "");
      const exerciseName = (record[mapping.exercise] || "").trim();
      if (!date || !exerciseName) return null;
      return {
        date,
        exerciseName,
        setIndex: Math.max(1, Math.round(parseNumber(mapping.set ? record[mapping.set] : "") || 1)),
        reps: mapping.reps ? parseNumber(record[mapping.reps]) : undefined,
        weightLbs: mapping.weight
          ? weightToLbs(parseNumber(record[mapping.weight]), mapping.weightUnit)
          : undefined,
        durationSeconds: mapping.duration
          ? durationSeconds(parseNumber(record[mapping.duration]), mapping.durationIsMinutes === true)
          : undefined,
        distanceMiles: mapping.distance
          ? distanceToMiles(parseNumber(record[mapping.distance]), mapping.distanceUnit)
          : undefined,
        notes: mapping.notes ? record[mapping.notes] || undefined : undefined,
      };
    },
    headers,
    "unknown"
  );
}
