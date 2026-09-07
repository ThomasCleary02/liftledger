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

  it("tags treadmill cardio without merging walk", () => {
    expect(splitExerciseDisplay("Treadmill Run")).toEqual({ title: "Run", tag: "Treadmill" });
    expect(splitExerciseDisplay("Running")).toEqual({ title: "Run", tag: null });
    expect(splitExerciseDisplay("Walk")).toEqual({ title: "Walk", tag: null });
    expect(splitExerciseDisplay("Walking Lunge")).toEqual({ title: "Walking Lunge", tag: null });
  });
});
