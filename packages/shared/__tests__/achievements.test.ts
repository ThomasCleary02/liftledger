import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_CATALOG,
  MAX_FEATURED_ACHIEVEMENTS,
  autoFeatureNewUnlocks,
  evaluateEarnedIds,
  mergeNewlyEarned,
  toggleFeaturedId,
} from "../achievements";
import { makeDay, strength } from "./dayFixture";

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

describe("achievement catalog", () => {
  it("has unique ids", () => {
    const ids = ACHIEVEMENT_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not treat a first session as a medal haul", () => {
    const days = [makeDay("2026-01-05", { exercises: [strength("Bench", [{ reps: 5, weight: 135 }])] })];
    expect(evaluateEarnedIds(days)).toEqual([]);
  });

  it("counts a true PR only after beating an earlier log of the same lift", () => {
    const days = [
      makeDay("2026-01-05", { exercises: [strength("Bench", [{ reps: 5, weight: 135 }])] }),
      makeDay("2026-01-12", { exercises: [strength("Bench", [{ reps: 5, weight: 145 }])] }),
    ];
    expect(evaluateEarnedIds(days)).toContain("true_pr");
    expect(evaluateEarnedIds(days.slice(0, 1))).not.toContain("true_pr");
  });

  it("unlocks a real month after four 3-day weeks, not a 3-day streak", () => {
    const start = parseISOSafe("2026-01-05");
    const days = [0, 1, 2, 7, 8, 9, 14, 15, 16, 21, 22, 23].map((offset) =>
      makeDay(ymd(addDays(start, offset)), { exercises: [strength("Squat", [{ reps: 5, weight: 185 }])] })
    );
    expect(evaluateEarnedIds(days)).toContain("rhythm_4");
    expect(evaluateEarnedIds(days.slice(0, 3))).not.toContain("rhythm_4");
  });

  it("keeps earned medals and will not auto-pin more than three", () => {
    const { next, added } = mergeNewlyEarned({}, ["true_pr", "rhythm_4"], "2026-01-01T00:00:00.000Z");
    expect(added).toEqual(["true_pr", "rhythm_4"]);
    const featured = autoFeatureNewUnlocks([], added, next);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(MAX_FEATURED_ACHIEVEMENTS);
    const ids = ACHIEVEMENT_CATALOG.slice(0, MAX_FEATURED_ACHIEVEMENTS).map((item) => item.id);
    const extra = ACHIEVEMENT_CATALOG[MAX_FEATURED_ACHIEVEMENTS].id;
    const packed = Object.fromEntries([...ids, extra].map((id) => [id, { earnedAt: "x" }]));
    expect(toggleFeaturedId(ids, extra, packed)).toEqual(ids);
  });

  it("does not refill pins after every medal is unpinned", () => {
    const earned = { true_pr: { earnedAt: "x" }, rhythm_4: { earnedAt: "x" } };
    expect(autoFeatureNewUnlocks([], [], earned)).toEqual([]);
    expect(autoFeatureNewUnlocks([], ["streak_7"], { ...earned, streak_7: { earnedAt: "y" } })).toEqual([]);
  });
});

function parseISOSafe(value: string): Date {
  const date = new Date(`${value}T12:00:00`);
  return date;
}
