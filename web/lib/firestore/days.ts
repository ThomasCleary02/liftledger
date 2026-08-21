import { dayService } from "../firebase";
import type {
  Day,
  NewDayInput,
  UpdateDayInput,
  ListDaysOptions,
} from "@liftledger/shared/firestore/days";
import { normalizeDateToYYYYMMDD } from "@liftledger/shared/firestore/days";
import {
  daysCacheIsFresh,
  daysCacheIsUsable,
  daysListCovers,
  daysRangeFromCache,
  forgetDay,
  patchCachedDay,
  peekDay,
  peekDaysArray,
  rememberDay,
  rememberDays,
  rememberEmptyDate,
} from "../sessionCache";

let listInflight: { limit: number; promise: Promise<Day[]> } | null = null;

function sortDays(days: Day[], order: "asc" | "desc"): Day[] {
  const copy = [...days];
  copy.sort((a, b) =>
    order === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
  );
  return copy;
}

async function refreshList(limit: number): Promise<Day[]> {
  if (listInflight && listInflight.limit >= limit) return listInflight.promise;
  const promise = dayService
    .listDays({ limit, order: "desc" })
    .then((days) => {
      rememberDays(days, { listComplete: days.length < limit, listLimit: limit });
      if (listInflight?.promise === promise) listInflight = null;
      return peekDaysArray();
    })
    .catch((error) => {
      if (listInflight?.promise === promise) listInflight = null;
      throw error;
    });
  listInflight = { limit, promise };
  return promise;
}

export async function listDays(options: ListDaysOptions = {}): Promise<Day[]> {
  const limit = options.limit ?? 1000;
  const order = options.order ?? "desc";
  if (options.startDate || options.endDate) {
    const days = await dayService.listDays(options);
    rememberDays(days);
    return days;
  }

  if (daysListCovers(limit) && daysCacheIsUsable()) {
    if (!daysCacheIsFresh()) {
      void refreshList(Math.max(limit, 1000)).catch(() => undefined);
    }
    return sortDays(peekDaysArray(), order).slice(0, limit);
  }

  const days = await refreshList(Math.max(limit, 20));
  return sortDays(days, order).slice(0, limit);
}

export async function getDayByDate(date: Date | string): Promise<Day | null> {
  const dateStr = normalizeDateToYYYYMMDD(date);
  const cached = peekDay(dateStr);
  if (cached !== undefined) return cached;
  const day = await dayService.getDayByDate(dateStr);
  if (day) rememberDay(day);
  else rememberEmptyDate(dateStr);
  return day;
}

export async function getDaysInRange(
  startDate: Date | string,
  endDate: Date | string
): Promise<Day[]> {
  const start = normalizeDateToYYYYMMDD(startDate);
  const end = normalizeDateToYYYYMMDD(endDate);
  const fromCache = daysRangeFromCache(start, end);
  if (fromCache) return fromCache.sort((a, b) => a.date.localeCompare(b.date));
  const days = await dayService.getDaysInRange(start, end);
  rememberDays(days);
  return days;
}

export async function createDay(input: NewDayInput): Promise<Day> {
  const day = await dayService.createDay(input);
  rememberDay(day);
  return day;
}

export async function updateDay(dayId: string, updates: UpdateDayInput): Promise<void> {
  await dayService.updateDay(dayId, updates);
  patchCachedDay(dayId, updates);
}

export async function deleteDay(dayId: string): Promise<void> {
  await dayService.deleteDay(dayId);
  forgetDay(dayId);
}

export const getDay = dayService.getDay.bind(dayService);
export const subscribeToDays = dayService.subscribeToDays.bind(dayService);

export type { Day, NewDayInput, UpdateDayInput, ListDaysOptions };
