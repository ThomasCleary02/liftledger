import { accountService } from "./firebase";
import { deleteDay, getDayByDate, updateDay } from "./firestore/days";

export async function undoLastImport(): Promise<{ days: number }> {
  const last = await accountService.getLastImport();
  if (!last) throw new Error("No import to undo");
  const created = new Set(last.createdDates);
  for (let i = 0; i < last.dates.length; i++) {
    const date = last.dates[i];
    const day = await getDayByDate(date);
    if (!day) continue;
    const remaining = day.exercises.filter((exercise) => exercise.importId !== last.id);
    if (remaining.length === 0 && created.has(date)) {
      await deleteDay(day.id);
      continue;
    }
    await updateDay(day.id, {
      exercises: remaining,
      importId: null,
      isRestDay: remaining.length === 0 ? day.isRestDay : false,
    });
  }
  await accountService.setLastImport(null);
  return { days: last.dates.length };
}
