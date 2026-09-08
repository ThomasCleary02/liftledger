import { describe, expect, it } from "vitest";
import { formatHoldClock, isHoldFocusedExercise } from "../holds";

describe("isHoldFocusedExercise", () => {
  it("matches plank and related holds", () => {
    expect(isHoldFocusedExercise("Plank")).toBe(true);
    expect(isHoldFocusedExercise("Side Plank")).toBe(true);
    expect(isHoldFocusedExercise("Wall Sit")).toBe(true);
    expect(isHoldFocusedExercise("Hollow Hold")).toBe(true);
    expect(isHoldFocusedExercise("Dead Hang")).toBe(true);
    expect(isHoldFocusedExercise("L-Sit")).toBe(true);
  });

  it("does not treat rep-based moves as holds", () => {
    expect(isHoldFocusedExercise("Push-Up")).toBe(false);
    expect(isHoldFocusedExercise("Hanging Leg Raise")).toBe(false);
    expect(isHoldFocusedExercise("Pull-Up")).toBe(false);
  });
});

describe("formatHoldClock", () => {
  it("formats mm:ss", () => {
    expect(formatHoldClock(0)).toBe("0:00");
    expect(formatHoldClock(65)).toBe("1:05");
  });
});
