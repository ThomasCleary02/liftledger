import { addDays, format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_ROADMAP,
  MAX_FEATURED_ACHIEVEMENTS,
  achievementTierLabel,
  autoFeatureNewUnlocks,
  browseAchievementCatalog,
  evaluateEarnedIds,
  formatAchievementProgress,
  getAchievementProgress,
  getActiveChallenges,
  mergeNewlyEarned,
  parseEarnedMap,
  toggleFeaturedId,
} from "../achievements";
import { makeDay, strength } from "./dayFixture";
import type { Exercise } from "../firestore/workouts";

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function cardio(
  name: string,
  data: { duration: number; distance?: number; activityType?: string }
): Exercise {
  return {
    name,
    modality: "cardio",
    cardioData: data as Exercise["cardioData"],
  };
}

describe("achievement catalog", () => {
  it("has unique ids", () => {
    const ids = ACHIEVEMENT_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const live = new Set(ids);
    ACHIEVEMENT_ROADMAP.forEach((item) => {
      expect(live.has(item.id)).toBe(false);
    });
  });

  it("keeps retired ids in BY_ID and parseEarnedMap", () => {
    expect(ACHIEVEMENT_BY_ID.sessions_250?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.volume_2_5m?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.engine_30?.retired).toBeUndefined();
    expect(ACHIEVEMENT_BY_ID.engine_30?.title).toBe("Heartwood");
    expect(ACHIEVEMENT_BY_ID.evergreen_200?.tier).toBe(4);
    expect(ACHIEVEMENT_BY_ID.mileage_club_100?.tier).toBe(5);
    expect(achievementTierLabel(5)).toBe("Diamond");
    const earned = parseEarnedMap({
      sessions_250: { earnedAt: "2026-01-01T00:00:00.000Z" },
      later_scale_witness: { earnedAt: "2026-01-01T00:00:00.000Z" },
    });
    expect(earned.sessions_250).toEqual({ earnedAt: "2026-01-01T00:00:00.000Z" });
    expect(earned.later_scale_witness).toBeUndefined();
  });

  it("browse hides unearned retired medals but shows live Platinum and Diamond", () => {
    const ids = browseAchievementCatalog().map((item) => item.id);
    expect(ids).not.toContain("sessions_250");
    expect(ids).not.toContain("volume_2_5m");
    expect(ids).not.toContain("pr_spark_3");
    expect(ids).not.toContain("pr_weather_5");
    expect(ids).not.toContain("true_tempest_12");
    expect(ids).not.toContain("road_fever_25");
    expect(ids).not.toContain("road_siege_50");
    expect(ids).toContain("engine_30");
    expect(ids).toContain("streak_90");
    expect(ids).toContain("rhythm_26");
    expect(ids).toContain("evergreen_200");
    expect(ids).toContain("two_moons_60");
    expect(ids).toContain("mileage_club_100");
    expect(ids).toContain("long_haul_50");
    expect(ids).toContain("true_dynasty_50");
    expect(ids).toContain("year_of_iron_300");
    expect(ids).toContain("smelter_1_5m");
    expect(ids).toContain("foundry_week_40k");
    expect(ids).toContain("anvil_month_120k");
    expect(ids).toContain("ultramarathon_week_40");
    expect(ids).toContain("sessions_100");
    expect(ids).toContain("volume_blitz_25k");
    expect(ids).toContain("footwork_40");
    expect(ids).toContain("stale_kill_90");
    expect(ids).toContain("return_fire");
    expect(ids).toContain("same_fight");
    expect(ids).toContain("rep_siege_500");
    expect(ids).not.toContain("stair_spark_3k");
    expect(ids).not.toContain("plank_pulse_5");
    expect(ACHIEVEMENT_BY_ID.foundry_week_40k?.tier).toBe(2);
  });

  it("marks PR burst and mid-run twins soft-retired", () => {
    expect(ACHIEVEMENT_BY_ID.pr_spark_3?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.pr_weather_5?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.pr_monsoon_8?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.true_tempest_12?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.pr_repeat?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.road_fever_25?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.road_siege_50?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.stair_spark_3k?.retired).toBe(true);
    expect(ACHIEVEMENT_BY_ID.plank_pulse_5?.retired).toBe(true);
  });

  it("browse shows earned retired medals", () => {
    const earned = { sessions_250: { earnedAt: "2026-01-01T00:00:00.000Z" } };
    const ids = browseAchievementCatalog(earned).map((item) => item.id);
    expect(ids).toContain("sessions_250");
    expect(ids).not.toContain("volume_2_5m");
  });

  it("does not newly award soft-retired ladder medals", () => {
    const start = new Date(2024, 0, 1);
    const days = Array.from({ length: 250 }, (_, i) =>
      makeDay(ymd(addDays(start, i)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
      })
    );
    const earned = evaluateEarnedIds(days);
    expect(earned).not.toContain("sessions_250");
    expect(earned).toContain("evergreen_200");
    expect(earned).toContain("sessions_100");
    expect(getAchievementProgress(days).sessions_250?.current).toBe(250);
  });

  it("mileage club requires run miles not walk", () => {
    const walkDays = [
      makeDay("2026-02-01", {
        exercises: [cardio("Walk", { duration: 3600, distance: 120, activityType: "walk" })],
      }),
    ];
    expect(evaluateEarnedIds(walkDays)).not.toContain("mileage_club_100");
    expect(getAchievementProgress(walkDays).mileage_club_100?.current).toBe(0);

    const runDays = Array.from({ length: 10 }, (_, i) =>
      makeDay(ymd(addDays(new Date(2026, 2, 1), i)), {
        exercises: [cardio("Run", { duration: 3600, distance: 10, activityType: "run" })],
      })
    );
    expect(evaluateEarnedIds(runDays)).toContain("mileage_club_100");
    expect(getAchievementProgress(runDays).mileage_club_100).toEqual({
      current: 100,
      target: 100,
      unit: "miles",
    });
  });

  it("unlocks foundry week at 40k in a 7-day window", () => {
    const heavy = strength(
      "Deadlift",
      Array.from({ length: 8 }, () => ({ reps: 5, weight: 1000 }))
    );
    const days = [makeDay("2026-03-01", { exercises: [heavy] })];
    expect(evaluateEarnedIds(days)).toContain("foundry_week_40k");
    expect(evaluateEarnedIds(days)).toContain("volume_blitz_25k");
    expect(getAchievementProgress(days).foundry_week_40k?.current).toBe(40_000);
  });

  it("road siege stays soft-retired; ultramarathon still requires run miles not walk", () => {
    const walkDays = [
      makeDay("2026-07-01", {
        exercises: [cardio("Walk", { duration: 7200, distance: 60, activityType: "walk" })],
      }),
    ];
    expect(evaluateEarnedIds(walkDays)).not.toContain("road_siege_50");
    expect(evaluateEarnedIds(walkDays)).not.toContain("odyssey_75");
    expect(evaluateEarnedIds(walkDays)).not.toContain("ultramarathon_week_40");

    const runDays = Array.from({ length: 5 }, (_, i) =>
      makeDay(ymd(addDays(new Date(2026, 6, 1), i)), {
        exercises: [cardio("Run", { duration: 3600, distance: 10, activityType: "run" })],
      })
    );
    expect(evaluateEarnedIds(runDays)).not.toContain("road_siege_50");
    expect(evaluateEarnedIds(runDays)).toContain("ultramarathon_week_40");
    expect(getAchievementProgress(runDays).road_siege_50).toEqual({
      current: 50,
      target: 50,
      unit: "miles",
    });
    expect(getAchievementProgress(runDays).ultramarathon_week_40).toEqual({
      current: 40,
      target: 40,
      unit: "miles",
    });
  });

  it("unbroken awards 21 consecutive trained days and breaks on rest", () => {
    const start = new Date(2026, 4, 1);
    const trained = Array.from({ length: 21 }, (_, i) =>
      makeDay(ymd(addDays(start, i)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
      })
    );
    expect(evaluateEarnedIds(trained)).toContain("unbroken_21");
    expect(getAchievementProgress(trained).unbroken_21).toEqual({ current: 21, target: 21 });

    const withRestGap = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeDay(ymd(addDays(start, i)), {
          exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
        })
      ),
      makeDay(ymd(addDays(start, 10)), { isRestDay: true, exercises: [] }),
      ...Array.from({ length: 10 }, (_, i) =>
        makeDay(ymd(addDays(start, 11 + i)), {
          exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
        })
      ),
    ];
    expect(evaluateEarnedIds(withRestGap)).not.toContain("unbroken_21");
    expect(getAchievementProgress(withRestGap).unbroken_21?.current).toBeLessThan(21);
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

  it("reports progress toward catalog medals without including roadmap ids", () => {
    const days = [
      makeDay("2026-01-05", { exercises: [strength("Bench", [{ reps: 5, weight: 135 }])] }),
      makeDay("2026-01-12", { exercises: [strength("Bench", [{ reps: 5, weight: 145 }])] }),
    ];
    const progress = getAchievementProgress(days);
    expect(progress.true_pr).toEqual({ current: 1, target: 1 });
    expect(progress.toolbox?.current).toBe(1);
    expect(progress.toolbox?.target).toBe(12);
    expect(progress.later_scale_witness).toBeUndefined();
    expect(formatAchievementProgress(progress.toolbox!)).toBe("1 / 12");
    expect(achievementTierLabel(1)).toBe("Bronze");
    expect(achievementTierLabel(4)).toBe("Platinum");
    expect(achievementTierLabel(5)).toBe("Diamond");
    expect(ACHIEVEMENT_ROADMAP.some((item) => item.id.includes("mileage") || item.id.includes("long_haul"))).toBe(
      false
    );
  });

  it("distance demon requires run miles not walk", () => {
    const walkDays = [
      makeDay("2026-02-01", {
        exercises: [cardio("Walk", { duration: 3600, distance: 12, activityType: "walk" })],
      }),
    ];
    expect(evaluateEarnedIds(walkDays)).not.toContain("distance_demon_10");

    const runDays = [
      makeDay("2026-02-01", {
        exercises: [cardio("Run", { duration: 1800, distance: 4, activityType: "run" })],
      }),
      makeDay("2026-02-03", {
        exercises: [cardio("Treadmill Run", { duration: 2400, distance: 3.5, activityType: "run" })],
      }),
      makeDay("2026-02-05", {
        exercises: [cardio("Running", { duration: 2100, distance: 2.5, activityType: "run" })],
      }),
    ];
    expect(evaluateEarnedIds(runDays)).toContain("distance_demon_10");
    expect(getAchievementProgress(runDays).distance_demon_10).toEqual({
      current: 10,
      target: 10,
      unit: "miles",
    });
  });

  it("unlocks volume siege at 50k in a 14-day window", () => {
    // 10 sets × 5 reps × 1000 lb = 50,000 lb on one day
    const heavy = strength(
      "Deadlift",
      Array.from({ length: 10 }, () => ({ reps: 5, weight: 1000 }))
    );
    const days = [makeDay("2026-03-01", { exercises: [heavy] })];
    expect(evaluateEarnedIds(days)).toContain("volume_siege_50k");
    expect(evaluateEarnedIds(days)).toContain("volume_blitz_25k");
    expect(getAchievementProgress(days).volume_siege_50k?.current).toBe(50_000);
  });

  it("does not newly award soft-retired PR spark", () => {
    const days = [
      makeDay("2026-04-01", {
        exercises: [
          strength("Bench", [{ reps: 5, weight: 100 }]),
          strength("Squat", [{ reps: 5, weight: 150 }]),
          strength("Row", [{ reps: 5, weight: 80 }]),
        ],
      }),
      makeDay("2026-04-03", {
        exercises: [
          strength("Bench", [{ reps: 5, weight: 110 }]),
          strength("Squat", [{ reps: 5, weight: 160 }]),
          strength("Row", [{ reps: 5, weight: 90 }]),
        ],
      }),
    ];
    expect(evaluateEarnedIds(days)).not.toContain("pr_spark_3");
    expect(getAchievementProgress(days).pr_spark_3).toEqual({ current: 3, target: 3 });
  });

  it("unlocks iron fortnight after 10 trained days in any 14-day window", () => {
    const start = parseISOSafe("2026-06-01");
    // 10 trained days spread across 14 calendar days (not a consecutive streak)
    const offsets = [0, 1, 2, 4, 5, 7, 8, 10, 12, 13];
    const days = offsets.map((offset) =>
      makeDay(ymd(addDays(start, offset)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
      })
    );
    // Rest day in the middle does not fill the trained-day bar
    days.push(makeDay(ymd(addDays(start, 3)), { isRestDay: true, exercises: [] }));

    expect(evaluateEarnedIds(days)).toContain("iron_fortnight_10");
    expect(getAchievementProgress(days).iron_fortnight_10).toEqual({ current: 10, target: 10 });
    expect(evaluateEarnedIds(days.slice(0, 9))).not.toContain("iron_fortnight_10");
    expect(getAchievementProgress(days.slice(0, 9)).iron_fortnight_10?.current).toBe(9);
  });

  it("does not newly award soft-retired PR weather", () => {
    const days = [
      makeDay("2026-07-01", {
        exercises: [
          strength("Bench", [{ reps: 5, weight: 100 }]),
          strength("Squat", [{ reps: 5, weight: 150 }]),
          strength("Row", [{ reps: 5, weight: 80 }]),
          strength("OHP", [{ reps: 5, weight: 70 }]),
          strength("Deadlift", [{ reps: 5, weight: 200 }]),
        ],
      }),
      makeDay("2026-07-10", {
        exercises: [
          strength("Bench", [{ reps: 5, weight: 110 }]),
          strength("Squat", [{ reps: 5, weight: 160 }]),
          strength("Row", [{ reps: 5, weight: 90 }]),
          strength("OHP", [{ reps: 5, weight: 75 }]),
          strength("Deadlift", [{ reps: 5, weight: 210 }]),
        ],
      }),
    ];
    expect(evaluateEarnedIds(days)).not.toContain("pr_weather_5");
    expect(getAchievementProgress(days).pr_weather_5).toEqual({ current: 5, target: 5 });
  });

  it("does not newly award soft-retired road fever", () => {
    const walkDays = [
      makeDay("2026-08-01", {
        exercises: [cardio("Walk", { duration: 7200, distance: 30, activityType: "walk" })],
      }),
    ];
    expect(evaluateEarnedIds(walkDays)).not.toContain("road_fever_25");
    expect(getAchievementProgress(walkDays).road_fever_25?.current).toBe(0);

    const runDays = [
      makeDay("2026-08-01", {
        exercises: [cardio("Run", { duration: 3600, distance: 10, activityType: "run" })],
      }),
      makeDay("2026-08-08", {
        exercises: [cardio("Treadmill Run", { duration: 3600, distance: 8, activityType: "run" })],
      }),
      makeDay("2026-08-14", {
        exercises: [cardio("Running", { duration: 3600, distance: 7, activityType: "run" })],
      }),
    ];
    expect(evaluateEarnedIds(runDays)).not.toContain("road_fever_25");
    expect(getAchievementProgress(runDays).road_fever_25).toEqual({
      current: 25,
      target: 25,
      unit: "miles",
    });
  });

  it("unlocks hybrid month when volume and cardio floors share a 30-day window", () => {
    // 20 sets × 5 reps × 200 lb = 20,000 lb
    const heavy = strength(
      "Squat",
      Array.from({ length: 20 }, () => ({ reps: 5, weight: 200 }))
    );
    const volumeOnly = [makeDay("2026-09-01", { exercises: [heavy] })];
    expect(evaluateEarnedIds(volumeOnly)).not.toContain("hybrid_month");

    const cardioOnly = [
      makeDay("2026-09-01", {
        exercises: [cardio("Bike", { duration: 3600, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(cardioOnly)).not.toContain("hybrid_month");

    // Same window: volume on day 1, 60 min cardio on day 20
    const both = [
      makeDay("2026-09-01", { exercises: [heavy] }),
      makeDay("2026-09-20", {
        exercises: [cardio("Bike", { duration: 3600, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(both)).toContain("hybrid_month");
    expect(getAchievementProgress(both).hybrid_month).toEqual({
      current: 2,
      target: 2,
      unit: "dual",
    });
    expect(formatAchievementProgress(getAchievementProgress(both).hybrid_month!)).toBe("2 / 2 goals");

    // Split across >30 days: both floors exist but not in the same window
    const split = [
      makeDay("2026-09-01", { exercises: [heavy] }),
      makeDay("2026-10-15", {
        exercises: [cardio("Bike", { duration: 3600, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(split)).not.toContain("hybrid_month");
  });

  it("never shows hybrid siege as 2/2 until both floors unlock", () => {
    // 40 sets × 5 × 195 = 39,000 lb (short of 40k) + almost 2h cardio
    const heavy = strength(
      "Squat",
      Array.from({ length: 40 }, () => ({ reps: 5, weight: 195 }))
    );
    const near = [
      makeDay("2026-09-01", { exercises: [heavy] }),
      makeDay("2026-09-15", {
        exercises: [cardio("Bike", { duration: 7000, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(near)).not.toContain("hybrid_siege");
    const metric = getAchievementProgress(near).hybrid_siege!;
    expect(metric.current).toBeLessThan(2);
    expect(formatAchievementProgress(metric)).not.toBe("2 / 2 goals");

    const unlockHeavy = strength(
      "Squat",
      Array.from({ length: 40 }, () => ({ reps: 5, weight: 200 }))
    );
    const unlock = [
      makeDay("2026-09-01", { exercises: [unlockHeavy] }),
      makeDay("2026-09-15", {
        exercises: [cardio("Bike", { duration: 7200, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(unlock)).toContain("hybrid_siege");
    expect(formatAchievementProgress(getAchievementProgress(unlock).hybrid_siege!)).toBe(
      "2 / 2 goals"
    );
  });

  it("awards long-horizon PR stories instead of burst ladders", () => {
    const start = new Date(2025, 0, 1);
    const stale = [
      makeDay(ymd(start), {
        exercises: [strength("Bench", [{ reps: 5, weight: 135 }])],
      }),
      makeDay(ymd(addDays(start, 100)), {
        exercises: [strength("Bench", [{ reps: 5, weight: 145 }])],
      }),
    ];
    expect(evaluateEarnedIds(stale)).toContain("stale_kill_90");
    expect(evaluateEarnedIds(stale.slice(0, 1))).not.toContain("stale_kill_90");

    const sameFightDays = Array.from({ length: 8 }, (_, i) =>
      makeDay(ymd(addDays(start, i * 3)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 185 }])],
      })
    );
    sameFightDays.push(
      makeDay(ymd(addDays(start, 30)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 195 }])],
      })
    );
    expect(evaluateEarnedIds(sameFightDays)).toContain("same_fight");
    expect(evaluateEarnedIds(sameFightDays.slice(0, 8))).not.toContain("same_fight");

    const returnFire = [
      makeDay("2026-01-01", {
        exercises: [strength("Deadlift", [{ reps: 5, weight: 225 }])],
      }),
      // 25 untrained days, then PR within 14d of return
      makeDay("2026-01-27", {
        exercises: [strength("Deadlift", [{ reps: 5, weight: 235 }])],
      }),
    ];
    expect(evaluateEarnedIds(returnFire)).toContain("return_fire");
  });

  it("awards foot/walk/hike/bike/push-up diversity and gold rep siege", () => {
    const walkOnly = [
      makeDay("2026-02-01", {
        exercises: [cardio("Walk", { duration: 3600, distance: 12, activityType: "walk" })],
      }),
    ];
    expect(evaluateEarnedIds(walkOnly)).toContain("sidewalk_stroll_10");
    expect(evaluateEarnedIds(walkOnly)).not.toContain("distance_demon_10");
    // 12 mi walk in 14d is under footwork 40
    expect(evaluateEarnedIds(walkOnly)).not.toContain("footwork_40");

    const footMix = [
      makeDay("2026-02-01", {
        exercises: [cardio("Walk", { duration: 3600, distance: 15, activityType: "walk" })],
      }),
      makeDay("2026-02-05", {
        exercises: [cardio("Run", { duration: 3600, distance: 15, activityType: "run" })],
      }),
      makeDay("2026-02-10", {
        exercises: [cardio("Hike", { duration: 7200, distance: 12, activityType: "hike" })],
      }),
    ];
    expect(evaluateEarnedIds(footMix)).toContain("footwork_40");
    expect(evaluateEarnedIds(footMix)).toContain("ridge_day_8");
    expect(evaluateEarnedIds(footMix)).not.toContain("ground_game_100");
    expect(getAchievementProgress(footMix).ground_game_100?.current).toBe(42);

    const bike = [
      makeDay("2026-03-01", {
        exercises: [cardio("Bike", { duration: 3600, distance: 25, activityType: "bike" })],
      }),
    ];
    expect(evaluateEarnedIds(bike)).toContain("spin_spark_25");

    const pushups = [
      makeDay("2026-03-03", {
        exercises: [
          {
            name: "Push-up",
            modality: "calisthenics",
            calisthenicsSets: Array.from({ length: 10 }, () => ({ reps: 15 })),
          },
        ],
      }),
    ];
    expect(evaluateEarnedIds(pushups)).toContain("pushup_week_150");
    expect(evaluateEarnedIds(pushups)).not.toContain("rep_siege_500");

    const repSiege = [
      makeDay("2026-03-05", {
        exercises: [
          {
            name: "Pull-up",
            modality: "calisthenics",
            calisthenicsSets: Array.from({ length: 20 }, () => ({ reps: 25 })),
          },
        ],
      }),
    ];
    expect(evaluateEarnedIds(repSiege)).toContain("rep_siege_500");
    expect(getAchievementProgress(repSiege).rep_siege_500).toEqual({ current: 500, target: 500 });

    const plank = [
      makeDay("2026-03-04", {
        exercises: [
          {
            name: "Plank",
            modality: "calisthenics",
            calisthenicsSets: [{ reps: 1, duration: 300 }],
          },
        ],
      }),
    ];
    expect(evaluateEarnedIds(plank)).not.toContain("plank_pulse_5");
    expect(getAchievementProgress(plank).plank_pulse_5).toEqual({ current: 5, target: 5 });

    const stairsOnly = [
      makeDay("2026-03-02", {
        exercises: [
          {
            name: "StairMaster",
            modality: "cardio",
            cardioData: { duration: 1800, steps: 3000, activityType: "stair" },
          },
        ],
      }),
    ];
    expect(evaluateEarnedIds(stairsOnly)).not.toContain("stair_spark_3k");

    const careerFoot = Array.from({ length: 10 }, (_, i) =>
      makeDay(ymd(addDays(new Date(2026, 4, 1), i * 10)), {
        exercises: [cardio("Walk", { duration: 3600, distance: 10, activityType: "walk" })],
      })
    );
    expect(evaluateEarnedIds(careerFoot)).toContain("ground_game_100");
  });

  it("surfaces closest unearned challenges first and skips retired", () => {
    const days = [
      makeDay("2026-05-01", {
        exercises: [cardio("Run", { duration: 1800, distance: 8, activityType: "run" })],
      }),
    ];
    const active = getActiveChallenges(days, {});
    expect(active.length).toBeGreaterThan(0);
    expect(active.length).toBeLessThanOrEqual(5);
    expect(active.every((item) => item.def.kind === "challenge")).toBe(true);
    expect(active.every((item) => !item.def.retired)).toBe(true);
    expect(active.every((item) => !(item.metric.target === 1 && item.metric.unit == null))).toBe(
      true
    );
    expect(active.map((item) => item.def.id)).not.toContain("return_fire");
    expect(active[0]!.def.id).toBe("distance_demon_10");
    expect(active[0]!.windowDays).toBe(7);
    expect(active.every((item) => !item.def.id.startsWith("later_"))).toBe(true);
  });
});

function parseISOSafe(value: string): Date {
  const date = new Date(`${value}T12:00:00`);
  return date;
}
