import type { Exercise, ImportedDay, LastImport } from "@liftledger/shared";
import { accountService } from "./firebase";
import { createDay, getDayByDate, updateDay } from "./firestore/days";

export type CommitMode = "merge" | "skipExisting";

export type CommitResult = {
  created: number;
  merged: number;
  skipped: number;
  importId: string;
};

async function mapPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await fn(current);
    }
  });
  await Promise.all(workers);
}

function tagExercises(exercises: Exercise[], importId: string): Exercise[] {
  return exercises.map((exercise) => ({ ...exercise, importId }));
}

export async function commitImportedDays(
  days: ImportedDay[],
  mode: CommitMode,
  onProgress?: (done: number, total: number) => void
): Promise<CommitResult> {
  const importId = `imp_${Date.now()}`;
  const result: CommitResult = { created: 0, merged: 0, skipped: 0, importId };
  const dates: string[] = [];
  const createdDates: string[] = [];
  let done = 0;
  await mapPool(days, 4, async (imported) => {
    const tagged = tagExercises(imported.exercises, importId);
    const existing = await getDayByDate(imported.date);
    if (existing) {
      if (mode === "skipExisting" && existing.exercises.length > 0) {
        result.skipped += 1;
      } else {
        const exercises = imported.isRestDay ? existing.exercises : [...existing.exercises, ...tagged];
        const isRestDay = exercises.length === 0 ? existing.isRestDay || imported.isRestDay : false;
        const notes = [existing.notes, imported.notes].filter(Boolean).join("\n") || undefined;
        await updateDay(existing.id, { exercises, isRestDay, notes, importId });
        result.merged += 1;
        dates.push(imported.date);
      }
    } else {
      await createDay({
        date: imported.date,
        isRestDay: imported.isRestDay,
        exercises: tagged,
        notes: imported.notes,
        importId,
      });
      result.created += 1;
      dates.push(imported.date);
      createdDates.push(imported.date);
    }
    done += 1;
    onProgress?.(done, days.length);
  });
  if (dates.length > 0) {
    const lastImport: LastImport = {
      id: importId,
      at: new Date().toISOString(),
      dates,
      createdDates,
    };
    await accountService.setLastImport(lastImport);
  }
  return result;
}
