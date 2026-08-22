import { describe, expect, it } from "vitest";
import {
  formatCardioDuration,
  formatDistance,
  formatPace,
  formatSpeed,
  formatWeight,
  formatWeightInput,
  getDistanceUnit,
  getWeightUnit,
  toDisplayDistance,
  toDisplayWeight,
  toStoredDistance,
  toStoredWeight,
} from "../utils/units";

describe("units", () => {
  it("formats stored pounds in imperial and metric", () => {
    expect(formatWeight(165, "imperial")).toBe("165 lb");
    expect(formatWeight(165, "metric")).toBe("74.8 kg");
  });

  it("round-trips weight through display conversion", () => {
    const stored = toStoredWeight(100, "metric");
    expect(toDisplayWeight(stored, "metric")).toBeCloseTo(100, 5);
    expect(toStoredWeight(135, "imperial")).toBe(135);
  });

  it("round-trips distance through display conversion", () => {
    const stored = toStoredDistance(5, "metric");
    expect(toDisplayDistance(stored, "metric")).toBeCloseTo(5, 5);
    expect(toStoredDistance(3.1, "imperial")).toBe(3.1);
  });

  it("formats distance, duration, pace, and speed", () => {
    expect(formatDistance(1, "imperial")).toBe("1.00 mi");
    expect(formatDistance(1, "metric")).toBe("1.61 km");
    expect(formatCardioDuration(0)).toBe("0m");
    expect(formatCardioDuration(90)).toBe("2m");
    expect(formatCardioDuration(3660)).toBe("1h 1m");
    expect(formatPace(480, "imperial")).toBe("8:00/mi");
    expect(formatSpeed(6, "imperial")).toBe("6.0 mph");
    expect(getWeightUnit("metric")).toBe("kg");
    expect(getDistanceUnit("imperial")).toBe("mi");
    expect(formatWeightInput(135.4, "imperial")).toBe("135");
  });
});
