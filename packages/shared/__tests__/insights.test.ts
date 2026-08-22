import { describe, expect, it } from "vitest";
import { analyzeProgress } from "../insights/api";
import { extractExerciseHistory, getMetricName, isNewPR, shouldFetchInsight } from "../insights/utils";
import { makeDay, strength } from "./dayFixture";

describe("analyzeProgress", () => {
  it("describes a first log and a new PR", () => {
    const first = analyzeProgress({
      exercise: "Bench Press",
      metric: "weight",
      history: [{ date: "2026-01-01", value: 135 }],
    });
    expect(first.insightText).toMatch(/First logged/);
    expect(first.isNewPR).toBe(false);

    const pr = analyzeProgress({
      exercise: "Bench Press",
      metric: "weight",
      history: [
        { date: "2026-01-01", value: 135 },
        { date: "2026-02-01", value: 155 },
      ],
    });
    expect(pr.isNewPR).toBe(true);
    expect(pr.delta).toBe(20);
    expect(pr.insightText).toMatch(/New PR/);
  });

  it("rejects empty history", () => {
    expect(() =>
      analyzeProgress({ exercise: "Bench", metric: "weight", history: [] })
    ).toThrow(/cannot be empty/);
  });
});

describe("insight helpers", () => {
  it("extracts max working weight history", () => {
    const history = extractExerciseHistory(
      [
        makeDay("2026-01-02", {
          exercises: [strength("Bench Press", [{ reps: 5, weight: 135 }])],
        }),
        makeDay("2026-01-01", {
          exercises: [
            strength("Bench Press", [
              { reps: 8, weight: 95, warmup: true },
              { reps: 5, weight: 125 },
            ]),
          ],
        }),
      ],
      "Bench Press",
      "strength"
    );
    expect(history.map((point) => point.value)).toEqual([125, 135]);
  });

  it("gates insights on session count and span", () => {
    const short = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      value: 100 + i,
    }));
    expect(shouldFetchInsight(short)).toBe(false);
    const longEnough = [
      ...short.slice(0, 7),
      { date: "2026-01-20", value: 120 },
    ];
    expect(shouldFetchInsight(longEnough)).toBe(true);
    expect(isNewPR([{ date: "2026-01-01", value: 100 }])).toBe(false);
    expect(
      isNewPR([
        { date: "2026-01-01", value: 100 },
        { date: "2026-01-02", value: 110 },
      ])
    ).toBe(true);
    expect(getMetricName("strength")).toBe("weight");
    expect(getMetricName("cardio", true)).toBe("distance");
    expect(getMetricName("calisthenics")).toBe("reps");
  });
});
