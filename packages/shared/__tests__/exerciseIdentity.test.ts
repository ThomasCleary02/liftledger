import { describe, expect, it } from "vitest";
import {
  resolveExerciseKey,
  buildCatalogIndexes,
  summarizeLoggedExercises,
  trackedMatchStatuses,
} from "../exerciseIdentity";
import { makeDay } from "./dayFixture";

describe("exerciseIdentity", () => {
  const catalog = [
    { id: "treadmill_run", name: "Treadmill Run", modality: "cardio" as const },
    { id: "treadmill", name: "Treadmill", modality: "cardio" as const },
    { id: "running", name: "Running", modality: "cardio" as const },
    { id: "walk", name: "Walk", modality: "cardio" as const },
    { id: "bench_press", name: "Bench Press", modality: "strength" as const },
  ];

  it("collapses treadmill and treadmill run to one key", () => {
    const indexes = buildCatalogIndexes(catalog);
    const a = resolveExerciseKey({ exerciseId: "treadmill", name: "Treadmill" }, indexes);
    const b = resolveExerciseKey({ exerciseId: "treadmill_run", name: "Treadmill Run" }, indexes);
    expect(a).toBe(b);
  });

  it("does not merge walk into run", () => {
    const indexes = buildCatalogIndexes(catalog);
    const run = resolveExerciseKey({ exerciseId: "running", name: "Running" }, indexes);
    const walk = resolveExerciseKey({ exerciseId: "walk", name: "Walk" }, indexes);
    expect(run).not.toBe(walk);
  });

  it("summarizes logged sessions by canonical key", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [
          {
            exerciseId: "treadmill",
            name: "Treadmill",
            modality: "cardio",
            cardioData: { duration: 1800, distance: 3 },
          },
        ],
      }),
      makeDay("2026-01-08", {
        exercises: [
          {
            exerciseId: "treadmill_run",
            name: "Treadmill Run",
            modality: "cardio",
            cardioData: { duration: 1200, distance: 2 },
          },
        ],
      }),
    ];
    const logged = summarizeLoggedExercises(days, catalog);
    const treadmill = logged.find((row) => row.exerciseId === "treadmill_run" || row.exerciseId === "treadmill");
    expect(treadmill?.sessionCount).toBe(2);
    expect(logged.filter((row) => /treadmill/i.test(row.exerciseId))).toHaveLength(1);
  });

  it("flags tracked running with only treadmill history as orphan with suggestions", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [
          {
            exerciseId: "treadmill",
            name: "Treadmill",
            modality: "cardio",
            cardioData: { duration: 1800, distance: 3 },
          },
        ],
      }),
    ];
    const logged = summarizeLoggedExercises(days, catalog);
    const statuses = trackedMatchStatuses(["running"], logged, catalog);
    const running = statuses.find((s) => s.trackedId === "running");
    expect(running?.hasMatchingHistory).toBe(false);
    expect(running?.suggestions.some((s) => /treadmill/i.test(s.exerciseId))).toBe(true);

    const withTwin = trackedMatchStatuses(["treadmill_run"], logged, catalog);
    expect(withTwin[0]?.hasMatchingHistory).toBe(true);
  });
});
