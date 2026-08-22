import { describe, expect, it } from "vitest";
import {
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
    expect(inferCardioActivityType("Morning walk")).toBe("walk");
    expect(inferCardioActivityType("Concept 2 row")).toBe("row");
    expect(inferCardioActivityType("Peloton")).toBe("bike");
    expect(inferCardioActivityType("Elliptical")).toBe("other");
  });

  it("resolves stored type over inference", () => {
    expect(resolveCardioActivityType("bike", "Treadmill Run")).toBe("bike");
    expect(resolveCardioActivityType("nope", "Treadmill Run")).toBe("run");
    expect(isCardioActivityType("run")).toBe(true);
    expect(isCardioActivityType("swim")).toBe(false);
  });

  it("maps pace kind and computes pace/speed", () => {
    expect(cardioPaceKind("run")).toBe("pace");
    expect(cardioPaceKind("bike")).toBe("speed");
    expect(cardioPaceKind("row")).toBe("none");
    expect(secondsPerMile(480, 1)).toBe(480);
    expect(milesPerHour(1800, 3)).toBe(6);
    expect(secondsPerMile(0, 1)).toBeUndefined();
  });
});
