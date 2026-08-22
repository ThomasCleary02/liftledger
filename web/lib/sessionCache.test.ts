import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./firebase", () => ({
  auth: { currentUser: { uid: "u1" } },
}));

import type { Day } from "@liftledger/shared/firestore/days";
import {
  clearSessionCache,
  daysCacheIsFresh,
  forgetDay,
  patchCachedDay,
  peekCatalog,
  peekDay,
  rememberCatalog,
  rememberDay,
  rememberEmptyDate,
} from "./sessionCache";

function day(date: string, extras: Partial<Day> = {}): Day {
  return {
    id: `u1_${date}`,
    userId: "u1",
    date,
    isRestDay: false,
    exercises: extras.exercises ?? [],
    createdAt: {} as Day["createdAt"],
    updatedAt: {} as Day["updatedAt"],
    ...extras,
  };
}

afterEach(() => {
  clearSessionCache();
});

describe("sessionCache", () => {
  it("remembers days, empty dates, and patches in place", () => {
    rememberDay(day("2026-08-21", { exercises: [{ name: "Bench", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] }] }));
    expect(peekDay("2026-08-21")?.exercises[0].name).toBe("Bench");
    rememberEmptyDate("2026-08-20");
    expect(peekDay("2026-08-20")).toBeNull();
    patchCachedDay("u1_2026-08-21", { isRestDay: true, exercises: [] });
    expect(peekDay("2026-08-21")?.isRestDay).toBe(true);
    forgetDay("u1_2026-08-21", "2026-08-21");
    expect(peekDay("2026-08-21")).toBeNull();
    expect(daysCacheIsFresh()).toBe(true);
  });

  it("expires the exercise catalog after TTL", () => {
    vi.useFakeTimers();
    rememberCatalog([{ id: "bench_press", name: "Bench Press", nameFolded: "bench press", modality: "strength" }]);
    expect(peekCatalog()?.[0].id).toBe("bench_press");
    vi.advanceTimersByTime(5 * 60_000 + 1);
    expect(peekCatalog()).toBeNull();
    vi.useRealTimers();
  });
});
