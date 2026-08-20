import type { Exercise } from "@liftledger/shared/firestore/workouts";

type LastWorkout = {
  date: string;
  exercises: Exercise[];
};

function lastMapKey(userId: string) {
  return `liftledger:lastExercises:${userId}`;
}

function lastWorkoutKey(userId: string) {
  return `liftledger:lastWorkout:${userId}`;
}

export function rememberExercises(userId: string, exercises: Exercise[]): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const current: Record<string, Exercise> = JSON.parse(localStorage.getItem(lastMapKey(userId)) || "{}");
    for (const ex of exercises) {
      const id = ex.exerciseId || ex.name;
      if (id) current[id] = ex;
    }
    localStorage.setItem(lastMapKey(userId), JSON.stringify(current));
  } catch {
    // ignore quota / private mode
  }
}

export function getCachedLastExercise(userId: string, exerciseId: string): Exercise | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const current: Record<string, Exercise> = JSON.parse(localStorage.getItem(lastMapKey(userId)) || "{}");
    return current[exerciseId] || null;
  } catch {
    return null;
  }
}

export function rememberLastWorkout(userId: string, date: string, exercises: Exercise[]): void {
  if (typeof window === "undefined" || !userId || exercises.length === 0) return;
  try {
    const payload: LastWorkout = { date, exercises };
    localStorage.setItem(lastWorkoutKey(userId), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getCachedLastWorkout(userId: string): LastWorkout | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(lastWorkoutKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastWorkout;
    if (!parsed?.date || !Array.isArray(parsed.exercises)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hydrateCacheFromDays(
  userId: string,
  days: Array<{ date: string; isRestDay: boolean; exercises: Exercise[] }>,
  currentDate: string
): void {
  if (typeof window === "undefined" || !userId) return;
  const newestFirst = [...days].sort((a, b) => b.date.localeCompare(a.date));
  let existing: Record<string, Exercise> = {};
  try {
    existing = JSON.parse(localStorage.getItem(lastMapKey(userId)) || "{}");
  } catch {
    existing = {};
  }
  const map: Record<string, Exercise> = {};
  for (const day of newestFirst) {
    for (const ex of day.exercises || []) {
      const id = ex.exerciseId || ex.name;
      if (id && !map[id]) map[id] = ex;
    }
  }
  for (const [id, ex] of Object.entries(existing)) {
    if (!map[id]) map[id] = ex;
  }
  try {
    localStorage.setItem(lastMapKey(userId), JSON.stringify(map));
  } catch {
    // ignore
  }
  const last = newestFirst.find(
    (day) => day.date !== currentDate && !day.isRestDay && day.exercises?.length > 0
  );
  if (last) {
    rememberLastWorkout(userId, last.date, last.exercises);
  }
}
