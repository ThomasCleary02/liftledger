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

describe("achievement catalog", () => {
  it("has unique ids", () => {
    const ids = ACHIEVEMENT_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("evaluates first session, iron, and a PR", () => {
    const days = [makeDay("2026-01-01", { exercises: [strength("Bench", [{ reps: 5, weight: 185 }])] })];
    const earned = evaluateEarnedIds(days);
    expect(earned).toContain("first_session");
    expect(earned).toContain("iron");
    expect(earned).toContain("first_pr");
    expect(earned).not.toContain("cardio_club");
  });

  it("unlocks a 3-day streak from history, not only today", () => {
    const days = [
      makeDay("2026-01-01", { exercises: [strength("A", [{ reps: 5, weight: 135 }])] }),
      makeDay("2026-01-02", { isRestDay: true }),
      makeDay("2026-01-03", { exercises: [strength("B", [{ reps: 5, weight: 135 }])] }),
    ];
    expect(evaluateEarnedIds(days)).toContain("streak_3");
  });

  it("keeps previously earned badges and caps featured pins", () => {
    const { next, added } = mergeNewlyEarned({}, ["first_session", "iron"], "2026-01-01T00:00:00.000Z");
    expect(added).toEqual(["first_session", "iron"]);
    const again = mergeNewlyEarned(next, ["first_session", "streak_3"], "2026-01-02T00:00:00.000Z");
    expect(again.added).toEqual(["streak_3"]);
    expect(again.next.first_session.earnedAt).toBe("2026-01-01T00:00:00.000Z");

    let featured = autoFeatureNewUnlocks([], added, next);
    expect(featured).toEqual(["first_session", "iron"]);
    featured = toggleFeaturedId(featured, "first_session", next);
    expect(featured).toEqual(["iron"]);
    const ids = ACHIEVEMENT_CATALOG.slice(0, MAX_FEATURED_ACHIEVEMENTS).map((item) => item.id);
    const extra = ACHIEVEMENT_CATALOG[MAX_FEATURED_ACHIEVEMENTS].id;
    const packed = Object.fromEntries([...ids, extra].map((id) => [id, { earnedAt: "x" }]));
    expect(toggleFeaturedId(ids, extra, packed)).toEqual(ids);
  });
});
