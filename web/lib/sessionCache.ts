import type { Day, UpdateDayInput } from "@liftledger/shared/firestore/days";
import type { ExerciseDoc } from "@liftledger/shared/firestore/exercises";
import { auth } from "./firebase";

const DAYS_FRESH_MS = 45_000;
const DAYS_STALE_MS = 5 * 60_000;
const CATALOG_TTL_MS = 5 * 60_000;

type DaysState = {
  uid: string;
  byDate: Map<string, Day>;
  emptyDates: Set<string>;
  fetchedAt: number;
  listComplete: boolean;
  maxListLimit: number;
};

let daysState: DaysState | null = null;
let catalog: ExerciseDoc[] | null = null;
let catalogAt = 0;

function currentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function ensureDaysState(): DaysState | null {
  const uid = currentUid();
  if (!uid) return null;
  if (!daysState || daysState.uid !== uid) {
    daysState = {
      uid,
      byDate: new Map(),
      emptyDates: new Set(),
      fetchedAt: 0,
      listComplete: false,
      maxListLimit: 0,
    };
  }
  return daysState;
}

export function rememberDays(
  days: Day[],
  options?: { listComplete?: boolean; listLimit?: number }
): void {
  const state = ensureDaysState();
  if (!state) return;
  days.forEach((day) => {
    if (!day.date) return;
    state.byDate.set(day.date, day);
    state.emptyDates.delete(day.date);
  });
  state.fetchedAt = Date.now();
  if (options?.listComplete) state.listComplete = true;
  if (options?.listLimit && options.listLimit > state.maxListLimit) {
    state.maxListLimit = options.listLimit;
  }
}

export function rememberDay(day: Day): void {
  rememberDays([day]);
}

export function rememberEmptyDate(date: string): void {
  const state = ensureDaysState();
  if (!state || state.byDate.has(date)) return;
  state.emptyDates.add(date);
}

export function forgetDay(dayId: string, date?: string): void {
  const state = daysState;
  if (!state) return;
  if (date) {
    state.byDate.delete(date);
    state.emptyDates.add(date);
    return;
  }
  const entries = Array.from(state.byDate.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, day] = entries[i];
    if (day.id === dayId) {
      state.byDate.delete(key);
      state.emptyDates.add(key);
      break;
    }
  }
}

export function patchCachedDay(dayId: string, updates: UpdateDayInput): void {
  const state = daysState;
  if (!state) return;
  const entries = Array.from(state.byDate.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, day] = entries[i];
    if (day.id !== dayId) continue;
    const next: Day = { ...day };
    if (updates.isRestDay !== undefined) next.isRestDay = updates.isRestDay;
    if (updates.exercises !== undefined) next.exercises = updates.exercises;
    if (updates.notes !== undefined) next.notes = updates.notes;
    if (updates.status !== undefined) {
      next.status = updates.status === "injured" ? "injured" : undefined;
    }
    if (updates.importId !== undefined) {
      next.importId = updates.importId ?? undefined;
    }
    state.byDate.set(key, next);
    break;
  }
}

/** `undefined` unknown, `null` known missing, otherwise the day. */
export function peekDay(date: string): Day | null | undefined {
  const state = daysState;
  const uid = currentUid();
  if (!state || state.uid !== uid) return undefined;
  if (state.byDate.has(date)) return state.byDate.get(date);
  if (state.emptyDates.has(date) || state.listComplete) return null;
  return undefined;
}

export function peekDaysArray(): Day[] {
  const state = daysState;
  const uid = currentUid();
  if (!state || state.uid !== uid) return [];
  return Array.from(state.byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export function daysListCovers(limit: number): boolean {
  const state = daysState;
  const uid = currentUid();
  if (!state || state.uid !== uid || state.fetchedAt === 0) return false;
  return state.listComplete || state.maxListLimit >= limit || state.byDate.size >= limit;
}

export function daysListIsComplete(): boolean {
  const state = daysState;
  const uid = currentUid();
  return Boolean(state && state.uid === uid && state.listComplete);
}

export function daysCacheAge(): number {
  if (!daysState || daysState.uid !== currentUid()) return Number.POSITIVE_INFINITY;
  return Date.now() - daysState.fetchedAt;
}

export function daysCacheIsFresh(): boolean {
  return daysCacheAge() < DAYS_FRESH_MS;
}

export function daysCacheIsUsable(): boolean {
  return daysCacheAge() < DAYS_STALE_MS;
}

export function daysRangeFromCache(start: string, end: string): Day[] | null {
  const state = daysState;
  const uid = currentUid();
  if (!state || state.uid !== uid || state.fetchedAt === 0) return null;
  const dates = Array.from(state.byDate.keys());
  let oldest = start;
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] < oldest) oldest = dates[i];
  }
  if (!state.listComplete && oldest > start) return null;
  return peekDaysArray().filter((day) => day.date >= start && day.date <= end);
}

export function clearSessionCache(): void {
  daysState = null;
  catalog = null;
  catalogAt = 0;
}

export function rememberCatalog(docs: ExerciseDoc[]): void {
  catalog = docs;
  catalogAt = Date.now();
}

export function peekCatalog(): ExerciseDoc[] | null {
  if (!catalog) return null;
  if (Date.now() - catalogAt > CATALOG_TTL_MS) return null;
  return catalog;
}

export function peekExercise(id: string): ExerciseDoc | null | undefined {
  if (!catalog) return undefined;
  const found = catalog.find((ex) => ex.id === id);
  return found ?? null;
}
