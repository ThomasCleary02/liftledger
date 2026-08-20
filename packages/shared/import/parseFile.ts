import { inferDateOrder, parseCsv, parseDateCell, parseNumber, pick, rowsToObjects, type DateOrder } from "./csv";
import { detectFormat, guessDistanceUnit, guessWeightUnit } from "./detect";
import { distanceToMiles, durationSeconds, recordsToRows, parseStrongLike, weightToLbs, type ParseUnits } from "./rows";
import type { ColumnMapping, DetectedFormat, ImportPreview, ImportRow, WeightUnit } from "./types";

export type ParseOverrides = {
  weightUnit?: WeightUnit;
  distanceUnit?: ImportPreview["distanceUnitGuess"];
  mapping?: ColumnMapping;
  dateOrder?: DateOrder;
};

function resolveDateOrder(records: Record<string, string>[], mappingDate?: string, override?: DateOrder): DateOrder {
  if (override) return override;
  const samples = records.slice(0, 80).map((record) =>
    mappingDate ? record[mappingDate] || "" : pick(record, ["Date", "start_time", "Start Time", "Workout Date", "date"])
  );
  const inferred = inferDateOrder(samples);
  return inferred === "dmy" ? "dmy" : "mdy";
}

function previewDateOrder(records: Record<string, string>[], mappingDate?: string): ImportPreview["dateOrder"] {
  const samples = records.slice(0, 80).map((record) =>
    mappingDate ? record[mappingDate] || "" : pick(record, ["Date", "start_time", "Start Time", "Workout Date", "date"])
  );
  return inferDateOrder(samples);
}

export function parseImportFile(text: string, overrides?: ParseOverrides): ImportPreview {
  const table = parseCsv(text);
  const { headers, records } = rowsToObjects(table);
  const format: DetectedFormat = overrides?.mapping ? "unknown" : detectFormat(headers);
  if (overrides?.mapping) {
    return parseMapped(records, headers, overrides.mapping, overrides.dateOrder);
  }
  const dateOrder = resolveDateOrder(records, undefined, overrides?.dateOrder);
  const unitsOverride = { ...overrides, dateOrder };
  if (format === "hevy") {
    return withInferredOrder(
      recordsToRows(records, (record, units) => parseHevy(record, units), headers, "hevy", unitsOverride),
      records
    );
  }
  if (format === "liftledger") {
    return withInferredOrder(parseLiftLedger(records, headers, unitsOverride), records);
  }
  if (format === "strong") {
    return withInferredOrder(
      recordsToRows(records, (record, units) => parseStrongLike(record, units), headers, "strong", unitsOverride),
      records
    );
  }
  return {
    format: "unknown",
    headers,
    rows: [],
    dayCount: 0,
    setCount: 0,
    sample: [],
    weightUnitGuess: overrides?.weightUnit ?? guessWeightUnit(headers),
    distanceUnitGuess: overrides?.distanceUnit ?? guessDistanceUnit(headers),
    warnings: ["This spreadsheet needs column matching before import."],
    dateOrder: previewDateOrder(records),
  };
}

function withInferredOrder(preview: ImportPreview, records: Record<string, string>[]): ImportPreview {
  return { ...preview, dateOrder: preview.dateOrder || previewDateOrder(records) };
}

function parseHevy(record: Record<string, string>, units: ParseUnits): ImportRow | null {
  const date = parseDateCell(pick(record, ["start_time", "Start Time", "Date"]), units.dateOrder);
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
  overrides?: ParseOverrides
): ImportPreview {
  const hasKgCol = headers.some((h) => /weight_kg/i.test(h));
  const hasLbCol = headers.some((h) => /weight_lb\b|weight_lbs/i.test(h));
  const hasKmCol = headers.some((h) => /distance_km/i.test(h));
  const hasMiCol = headers.some((h) => /distance_mi/i.test(h));
  const weightUnit = hasKgCol ? "kg" : hasLbCol ? "lb" : overrides?.weightUnit ?? guessWeightUnit(headers);
  const distanceUnit = hasKmCol ? "km" : hasMiCol ? "mi" : overrides?.distanceUnit ?? guessDistanceUnit(headers);
  return recordsToRows(
    records,
    (record, units) => {
      const date = parseDateCell(pick(record, ["date"]), units.dateOrder);
      const rest = pick(record, ["restDay", "restday"]).toLowerCase() === "true";
      const exerciseName = pick(record, ["exercise"]);
      if (!date) return null;
      if (rest && !exerciseName) {
        return { date, exerciseName: "", setIndex: 1, restDay: true };
      }
      if (!exerciseName) return null;
      const kg = parseNumber(pick(record, ["weight_kg"]));
      const lb = parseNumber(pick(record, ["weight_lb", "weight_lbs"]));
      const km = parseNumber(pick(record, ["distance_km"]));
      const mi = parseNumber(pick(record, ["distance_mi", "distance_miles"]));
      const modalityRaw = pick(record, ["modality"]).toLowerCase();
      const modality =
        modalityRaw === "strength" || modalityRaw === "cardio" || modalityRaw === "calisthenics"
          ? modalityRaw
          : undefined;
      return {
        date,
        exerciseName,
        setIndex: Math.max(1, Math.round(parseNumber(pick(record, ["set"])) || 1)),
        reps: parseNumber(pick(record, ["reps"])),
        weightLbs:
          kg != null ? weightToLbs(kg, "kg") : lb != null ? weightToLbs(lb, "lb") : weightToLbs(parseNumber(pick(record, ["weight"])), weightUnit),
        durationSeconds: parseNumber(pick(record, ["durationSeconds", "duration"])),
        distanceMiles:
          km != null
            ? distanceToMiles(km, "km")
            : mi != null
              ? distanceToMiles(mi, "mi")
              : distanceToMiles(parseNumber(pick(record, ["distance"])), distanceUnit),
        notes: pick(record, ["notes"]) || undefined,
        restDay: rest,
        warmup: pick(record, ["warmup"]).toLowerCase() === "true" || undefined,
        modality,
      };
    },
    headers,
    "liftledger",
    { ...overrides, weightUnit, distanceUnit }
  );
}

export function parseMapped(
  records: Record<string, string>[],
  headers: string[],
  mapping: ColumnMapping,
  dateOrderOverride?: DateOrder
): ImportPreview {
  const dateOrder = resolveDateOrder(records, mapping.date, dateOrderOverride);
  const preview = recordsToRows(
    records,
    (record, units) => {
      const date = parseDateCell(record[mapping.date] || "", units.dateOrder);
      const exerciseName = (record[mapping.exercise] || "").trim();
      if (!date || !exerciseName) return null;
        const setRaw = mapping.set ? record[mapping.set] || "" : "";
      const warmup = /^\s*w/i.test(setRaw || "");
      return {
        date,
        exerciseName,
        setIndex: Math.max(1, Math.round(parseNumber(setRaw.replace(/^\s*[wdf]/i, "")) || 1)),
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
        warmup: warmup || undefined,
      };
    },
    headers,
    "unknown",
    { weightUnit: mapping.weightUnit, distanceUnit: mapping.distanceUnit, dateOrder }
  );
  return { ...preview, dateOrder: inferDateOrder(records.map((record) => record[mapping.date] || "")) };
}
