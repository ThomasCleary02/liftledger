import type { ImportRow, WeightUnit } from "./types";
import { weightToLbs } from "./rows";

const MAX_SETS = 200;

export type PasteParseResult = {
  rows: ImportRow[];
  skipped: string[];
  capped?: boolean;
};

export function parsePastedWorkout(
  text: string,
  date: string,
  weightUnit: WeightUnit
): PasteParseResult {
  const rows: ImportRow[] = [];
  const skipped: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let setCounter = 1;
  let capped = false;
  for (const line of lines) {
    if (rows.length >= MAX_SETS) {
      capped = true;
      break;
    }
    const setsOf = line.match(/^(.+?)\s+(\d+)\s*[x×]\s*(\d+)(?:\s+@?\s*(\d+(?:\.\d+)?))?$/i);
    if (setsOf) {
      const name = setsOf[1].trim();
      const sets = Number(setsOf[2]);
      const reps = Number(setsOf[3]);
      const weight = setsOf[4] != null ? Number(setsOf[4]) : undefined;
      const count = Math.min(sets, 20);
      for (let i = 0; i < count && rows.length < MAX_SETS; i++) {
        rows.push({
          date,
          exerciseName: name,
          setIndex: i + 1,
          reps,
          weightLbs: weightToLbs(weight, weightUnit),
        });
      }
      if (sets > 20 || rows.length >= MAX_SETS) capped = rows.length >= MAX_SETS;
      setCounter = 1;
      continue;
    }
    const oneSet = line.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)$/);
    if (oneSet) {
      rows.push({
        date,
        exerciseName: oneSet[1].trim(),
        setIndex: setCounter++,
        reps: Number(oneSet[2]),
        weightLbs: weightToLbs(Number(oneSet[3]), weightUnit),
      });
      continue;
    }
    const cardioMin = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(min|minutes|m)\b/i);
    if (cardioMin) {
      rows.push({
        date,
        exerciseName: cardioMin[1].trim(),
        setIndex: 1,
        durationSeconds: Math.round(Number(cardioMin[2]) * 60),
      });
      continue;
    }
    const cardioDist = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(mi|km|miles|kilometers?)\b/i);
    if (cardioDist) {
      const unit = cardioDist[3].toLowerCase().startsWith("km") ? "km" : "mi";
      const miles = unit === "km" ? Number(cardioDist[2]) / 1.60934 : Number(cardioDist[2]);
      rows.push({
        date,
        exerciseName: cardioDist[1].trim(),
        setIndex: 1,
        distanceMiles: miles,
      });
      continue;
    }
    skipped.push(line);
  }
  return { rows, skipped, capped: capped || undefined };
}
