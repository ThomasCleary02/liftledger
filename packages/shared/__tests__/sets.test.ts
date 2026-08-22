import { describe, expect, it } from "vitest";
import { isWarmupSet, maxWorkingWeight, strengthVolume, workingStrengthSets } from "../sets";

describe("sets", () => {
  const sets = [
    { reps: 8, weight: 95, warmup: true },
    { reps: 5, weight: 135 },
    { reps: 5, weight: 155 },
  ];

  it("treats missing warmup as working", () => {
    expect(isWarmupSet(undefined)).toBe(false);
    expect(isWarmupSet({ reps: 5, weight: 135 })).toBe(false);
    expect(isWarmupSet(sets[0])).toBe(true);
  });

  it("excludes warmup from volume and max weight", () => {
    expect(workingStrengthSets(sets)).toHaveLength(2);
    expect(strengthVolume(sets)).toBe(5 * 135 + 5 * 155);
    expect(maxWorkingWeight(sets)).toBe(155);
    expect(strengthVolume(null)).toBe(0);
    expect(maxWorkingWeight(undefined)).toBe(0);
  });
});
