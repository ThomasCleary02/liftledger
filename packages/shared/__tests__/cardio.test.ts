import { describe, expect, it } from "vitest";
import {
  cardioDistanceFamily,
  cardioPaceKind,
  inferCardioActivityType,
  isCardioActivityType,
  milesPerHour,
  resolveCardioActivityType,
  secondsPerMile,
} from "../cardio";

describe("cardio", () => {
  it("infers activity from names", () => {
    expect(inferCardioActivityType("Treadmill Run")).toBe("run");
    expect(inferCardioActivityType("Treadmill Walk")).toBe("walk");
    expect(inferCardioActivityType("Morning walk")).toBe("walk");
    expect(inferCardioActivityType("Concept 2 row")).toBe("row");
    expect(inferCardioActivityType("Peloton")).toBe("bike");
    expect(inferCardioActivityType("Stair Climber")).toBe("stair");
    expect(inferCardioActivityType("Step Master")).toBe("stair");
    expect(inferCardioActivityType("Elliptical")).toBe("elliptical");
  });

  it("resolves stored type over inference", () => {
    expect(resolveCardioActivityType("bike", "Treadmill Run")).toBe("bike");
    expect(resolveCardioActivityType("nope", "Treadmill Run")).toBe("run");
    expect(isCardioActivityType("run")).toBe(true);
    expect(isCardioActivityType("stair")).toBe(true);
    expect(isCardioActivityType("swim")).toBe(true);
    expect(isCardioActivityType("nope")).toBe(false);
  });

  it("maps distance families without merging run/walk for PRs", () => {
    expect(cardioDistanceFamily("run")).toBe("foot");
    expect(cardioDistanceFamily("walk")).toBe("foot");
    expect(cardioDistanceFamily("hike")).toBe("foot");
    expect(cardioDistanceFamily("bike")).toBe("bike");
    expect(cardioDistanceFamily("row")).toBe("row");
    expect(cardioDistanceFamily("stair")).toBe("stair");
    expect(cardioDistanceFamily("elliptical")).toBeNull();
    expect(cardioDistanceFamily("swim")).toBeNull();
  });

  it("maps pace kind and computes pace/speed", () => {
    expect(cardioPaceKind("run")).toBe("pace");
    expect(cardioPaceKind("bike")).toBe("speed");
    expect(cardioPaceKind("row")).toBe("none");
    expect(cardioPaceKind("stair")).toBe("none");
    expect(secondsPerMile(480, 1)).toBe(480);
    expect(milesPerHour(1800, 3)).toBe(6);
    expect(secondsPerMile(0, 1)).toBeUndefined();
  });
});
