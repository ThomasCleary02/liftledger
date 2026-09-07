import { format, subDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { buildPublicAchievements, DEFAULT_ACHIEVEMENT_SHARE } from "../achievements";
import { makeDay, strength } from "./dayFixture";

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

describe("buildPublicAchievements", () => {
  it("returns null when sharing is off", () => {
    const days = [makeDay("2026-09-01", { exercises: [strength("Bench", [{ reps: 5, weight: 185 }])] })];
    expect(buildPublicAchievements(days, [], DEFAULT_ACHIEVEMENT_SHARE)).toBeNull();
  });

  it("includes streak and pinned PRs when enabled", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [
      makeDay(ymd(today), { exercises: [strength("Bench Press", [{ reps: 5, weight: 225 }])] }),
      makeDay(ymd(subDays(today, 1)), { exercises: [strength("Squat", [{ reps: 5, weight: 275 }])] }),
    ];
    const allOn = { enabled: true, showStreak: true, showPRs: true, pinnedKeys: [] as string[] };
    const open = buildPublicAchievements(days, [], allOn);
    expect(open?.currentStreak).toBeGreaterThanOrEqual(1);
    expect(open?.prs?.length).toBeGreaterThan(0);

    const bench = open?.prs?.find((pr) => pr.exerciseName === "Bench Press");
    expect(bench).toBeTruthy();
    const pinnedOnly = buildPublicAchievements(days, [], {
      ...allOn,
      pinnedKeys: bench ? [bench.key] : [],
    });
    expect(pinnedOnly?.prs?.every((pr) => pr.key === bench?.key)).toBe(true);
  });

  it("omits PRs when showPRs is false", () => {
    const days = [makeDay(ymd(new Date()), { exercises: [strength("Row", [{ reps: 5, weight: 135 }])] })];
    const snapshot = buildPublicAchievements(days, [], {
      enabled: true,
      showStreak: true,
      showPRs: false,
      pinnedKeys: [],
    });
    expect(snapshot?.prs).toBeUndefined();
    expect(snapshot?.currentStreak).toBeDefined();
  });
});
