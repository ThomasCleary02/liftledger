import { afterEach, describe, expect, it } from "vitest";
import {
  getCachedLastExercise,
  getCachedLastWorkout,
  hydrateCacheFromDays,
  rememberExercises,
  rememberLastWorkout,
} from "./lastExerciseCache";

afterEach(() => {
  localStorage.clear();
});

describe("lastExerciseCache", () => {
  it("stores per-exercise and last workout snapshots", () => {
    rememberExercises("u1", [{ name: "Bench Press", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] }]);
    expect(getCachedLastExercise("u1", "Bench Press")?.strengthSets?.[0].weight).toBe(135);
    rememberLastWorkout("u1", "2026-08-20", [
      { name: "Squat", modality: "strength", strengthSets: [{ reps: 5, weight: 185 }] },
    ]);
    expect(getCachedLastWorkout("u1")).toMatchObject({ date: "2026-08-20" });
  });

  it("hydrates from newer days without using the current date as last workout", () => {
    hydrateCacheFromDays(
      "u1",
      [
        {
          date: "2026-08-21",
          isRestDay: false,
          exercises: [{ name: "Today Lift", modality: "strength", strengthSets: [{ reps: 1, weight: 1 }] }],
        },
        {
          date: "2026-08-20",
          isRestDay: false,
          exercises: [{ name: "Yesterday Lift", modality: "strength", strengthSets: [{ reps: 5, weight: 100 }] }],
        },
      ],
      "2026-08-21"
    );
    expect(getCachedLastExercise("u1", "Yesterday Lift")?.name).toBe("Yesterday Lift");
    expect(getCachedLastWorkout("u1")?.date).toBe("2026-08-20");
  });
});
