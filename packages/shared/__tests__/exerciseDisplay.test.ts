import { describe, expect, it } from "vitest";
import { splitExerciseDisplay } from "../exerciseDisplay";

describe("splitExerciseDisplay", () => {
  it("leaves a plain barbell name untagged", () => {
    expect(splitExerciseDisplay("Bench Press")).toEqual({ title: "Bench Press", tag: null });
  });

  it("tags smith before machine", () => {
    expect(splitExerciseDisplay("Smith Machine Bench Press")).toEqual({
      title: "Bench Press",
      tag: "Smith",
    });
  });

  it("tags dumbbell and machine variants", () => {
    expect(splitExerciseDisplay("Dumbbell Bench Press")).toEqual({
      title: "Bench Press",
      tag: "Dumbbell",
    });
    expect(splitExerciseDisplay("Chest Press Machine")).toEqual({
      title: "Chest Press",
      tag: "Machine",
    });
  });

  it("keeps treadmill names untagged so the chip is not redundant", () => {
    expect(splitExerciseDisplay("Treadmill Run")).toEqual({ title: "Treadmill Run", tag: null });
    expect(splitExerciseDisplay("Treadmill")).toEqual({ title: "Treadmill", tag: null });
    expect(splitExerciseDisplay("Running")).toEqual({ title: "Run", tag: null });
    expect(splitExerciseDisplay("Walk")).toEqual({ title: "Walk", tag: null });
    expect(splitExerciseDisplay("Walking Lunge")).toEqual({ title: "Walking Lunge", tag: null });
  });
});
