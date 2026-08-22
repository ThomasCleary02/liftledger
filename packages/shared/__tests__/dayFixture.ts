import type { Day } from "../firestore/days";
import type { Exercise } from "../firestore/workouts";

export function makeDay(date: string, extras: Partial<Omit<Day, "date" | "id">> = {}): Day {
  const userId = extras.userId ?? "u";
  return {
    id: `${userId}_${date}`,
    userId,
    date,
    isRestDay: extras.isRestDay ?? false,
    exercises: extras.exercises ?? [],
    notes: extras.notes,
    status: extras.status,
    importId: extras.importId,
    createdAt: extras.createdAt ?? ({} as Day["createdAt"]),
    updatedAt: extras.updatedAt ?? ({} as Day["updatedAt"]),
  };
}

export function strength(name: string, sets: { reps: number; weight: number; warmup?: boolean }[]): Exercise {
  return { name, modality: "strength", strengthSets: sets };
}
