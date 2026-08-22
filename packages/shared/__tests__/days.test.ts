import { describe, expect, it } from "vitest";
import { generateDayId, isLoggedDay, normalizeDateToYYYYMMDD } from "../firestore/days";
import { isValidUsername, normalizeUsername } from "../firestore/usernameIndex";
import { makeDay, strength } from "./dayFixture";

describe("days", () => {
  it("normalizes YYYY-MM-DD strings and local dates", () => {
    expect(normalizeDateToYYYYMMDD("2026-08-21")).toBe("2026-08-21");
    expect(normalizeDateToYYYYMMDD(new Date(2026, 7, 21))).toBe("2026-08-21");
  });

  it("builds day ids as userId_date", () => {
    expect(generateDayId("abc", "2026-08-21")).toBe("abc_2026-08-21");
  });

  it("counts logged days as workouts or rest, not injured", () => {
    expect(isLoggedDay(makeDay("2026-01-01", { exercises: [strength("Squat", [{ reps: 5, weight: 135 }])] }))).toBe(
      true
    );
    expect(isLoggedDay(makeDay("2026-01-02", { isRestDay: true }))).toBe(true);
    expect(isLoggedDay(makeDay("2026-01-03"))).toBe(false);
    expect(isLoggedDay(makeDay("2026-01-04", { status: "injured", exercises: [strength("Squat", [{ reps: 1, weight: 1 }])] }))).toBe(
      false
    );
  });
});

describe("normalizeUsername", () => {
  it("strips @ and lowercases", () => {
    expect(normalizeUsername("  @ThomCleary  ")).toBe("thomcleary");
  });

  it("accepts signup-safe usernames", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("user_name-1")).toBe(true);
    expect(isValidUsername("bad name")).toBe(false);
  });
});
