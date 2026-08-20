import { inferCardioActivityType } from "../cardio";
import type { Exercise } from "../firestore/workouts";
import type { ExerciseDoc } from "../firestore/exercises";
import type { ImportRow, ImportedDay } from "./types";

function fold(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchCatalog(name: string, catalog?: ExerciseDoc[]): ExerciseDoc | undefined {
  if (!catalog?.length) return undefined;
  const folded = fold(name);
  return catalog.find((item) => fold(item.name) === folded || fold(item.nameFolded) === folded);
}

function rowModality(row: ImportRow, catalogMatch?: ExerciseDoc): Exercise["modality"] {
  if (catalogMatch) return catalogMatch.modality;
  const hasCardio = (row.durationSeconds != null && row.durationSeconds > 0) || (row.distanceMiles != null && row.distanceMiles > 0);
  const hasWeight = row.weightLbs != null && row.weightLbs > 0;
  if (hasCardio && !hasWeight && !(row.reps && row.reps > 0 && hasWeight)) {
    if (!row.reps || hasCardio) return "cardio";
  }
  if (!hasWeight && row.reps && row.reps > 0) return "calisthenics";
  return "strength";
}

export function rowsToImportedDays(rows: ImportRow[], catalog?: ExerciseDoc[]): ImportedDay[] {
  const byDate = new Map<string, ImportRow[]>();
  for (const row of rows) {
    if (!row.date) continue;
    const list = byDate.get(row.date) || [];
    list.push(row);
    byDate.set(row.date, list);
  }
  const days: ImportedDay[] = [];
  const dated = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 0; i < dated.length; i++) {
    const date = dated[i][0];
    const dateRows = dated[i][1];
    const restOnly = dateRows.every((row: ImportRow) => row.restDay && !row.exerciseName);
    if (restOnly) {
      days.push({ date, isRestDay: true, exercises: [] });
      continue;
    }
    const groups = new Map<string, ImportRow[]>();
    const named = dateRows.filter((item: ImportRow) => item.exerciseName);
    for (let j = 0; j < named.length; j++) {
      const row = named[j];
      const key = fold(row.exerciseName);
      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    }
    const exercises: Exercise[] = [];
    const grouped = Array.from(groups.values());
    for (let g = 0; g < grouped.length; g++) {
      const group = grouped[g];
      group.sort((a: ImportRow, b: ImportRow) => a.setIndex - b.setIndex);
      const first = group[0];
      const catalogMatch = matchCatalog(first.exerciseName, catalog);
      const modality = rowModality(first, catalogMatch);
      const exercise: Exercise = {
        name: first.exerciseName,
        modality,
        exerciseId: catalogMatch?.id,
      };
      if (modality === "cardio") {
        const duration = group.reduce((sum: number, row: ImportRow) => sum + (row.durationSeconds || 0), 0);
        const distance = group.reduce((sum: number, row: ImportRow) => sum + (row.distanceMiles || 0), 0);
        exercise.cardioData = {
          duration: duration > 0 ? duration : 0,
          activityType: inferCardioActivityType(first.exerciseName, catalogMatch?.id),
        };
        if (distance > 0) exercise.cardioData.distance = distance;
      } else if (modality === "calisthenics") {
        exercise.calisthenicsSets = group.map((row: ImportRow) => ({
          reps: row.reps && row.reps > 0 ? row.reps : 1,
          duration: row.durationSeconds,
        }));
      } else {
        exercise.strengthSets = group.map((row: ImportRow) => ({
          reps: row.reps && row.reps > 0 ? row.reps : 1,
          weight: row.weightLbs != null ? row.weightLbs : 0,
        }));
      }
      exercises.push(exercise);
    }
    const workoutName = dateRows.map((row: ImportRow) => row.workoutName).find(Boolean);
    const setNotes = Array.from(
      new Set(dateRows.map((row: ImportRow) => row.notes).filter(Boolean) as string[])
    );
    const notes = [workoutName, ...setNotes].filter(Boolean).join("\n");
    days.push({ date, isRestDay: false, exercises, notes: notes || undefined });
  }
  return days;
}
