import { describe, expect, it } from "vitest";
import { formatPlatePlan, looksLikeBarbell, platesForBar } from "../plates";

describe("plates", () => {
  it("detects barbell lifts and skips dumbbells/machines", () => {
    expect(looksLikeBarbell("Barbell Bench Press")).toBe(true);
    expect(looksLikeBarbell("Squat")).toBe(true);
    expect(looksLikeBarbell("Dumbbell Bench Press")).toBe(false);
    expect(looksLikeBarbell("Cable Row")).toBe(false);
    expect(looksLikeBarbell("")).toBe(false);
  });

  it("plans 225 lb as a 45 bar plus two 45s per side", () => {
    const plan = platesForBar(225, "lb");
    expect(plan).toMatchObject({ bar: 45, remainder: 0 });
    expect(plan?.perSide).toEqual([{ weight: 45, count: 2 }]);
    expect(formatPlatePlan(plan!, "lb")).toBe("45 lb bar + 2×45/side");
  });

  it("returns null below bar weight", () => {
    expect(platesForBar(40, "lb")).toBeNull();
    expect(platesForBar(0, "kg")).toBeNull();
  });
});
