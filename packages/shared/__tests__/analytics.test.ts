import { format, subDays } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  calculateCurrentStreakFromDays,
  calculateLongestStreakFromDays,
  calculateTotalCalisthenicsRepsFromDays,
  calculateTotalCardioDurationFromDays,
  calculateTotalVolumeFromDays,
  filterDaysByPeriod,
  collapsePRsByExercise,
  findAllPRs,
  findFavoriteExerciseFromDays,
  getLiftProgress,
  getAnalyticsSummaryFromDays,
  getCardioAnalytics,
  getStrengthAnalytics,
  getVolumeDataPoints,
  getBodyweightPoints,
  getBodyweightChangeLbs,
} from "../analytics/calculations";
import { getCardioDistanceLeaderboard, getConsistencyLeaderboard, getVolumeLeaderboard } from "../analytics/leaderboards";
import { groupDaysByUserId } from "../firestore/leaderboards";
import { makeDay, strength } from "./dayFixture";

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

describe("analytics from days", () => {
  it("sums working volume and ignores warmup and cardio", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [
          strength("Bench", [
            { reps: 5, weight: 135 },
            { reps: 8, weight: 95, warmup: true },
          ]),
          { name: "Run", modality: "cardio", cardioData: { duration: 600, distance: 1 } },
        ],
      }),
    ];
    expect(calculateTotalVolumeFromDays(days)).toBe(5 * 135);
    expect(calculateTotalCardioDurationFromDays(days)).toBe(600);
  });

  it("computes current and longest streaks", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [0, 1, 2].map((offset) =>
      makeDay(ymd(subDays(today, offset)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 135 }])],
      })
    );
    expect(calculateCurrentStreakFromDays(days)).toBe(3);
    const fourDaysEndingYesterday = [1, 2, 3, 4].map((offset) =>
      makeDay(ymd(subDays(today, offset)), {
        exercises: [strength("Squat", [{ reps: 5, weight: 135 }])],
      })
    );
    expect(calculateCurrentStreakFromDays(fourDaysEndingYesterday)).toBe(4);
    expect(
      calculateCurrentStreakFromDays([
        makeDay(ymd(today), { exercises: [strength("Squat", [{ reps: 5, weight: 135 }])] }),
        ...fourDaysEndingYesterday,
      ])
    ).toBe(5);
    expect(
      calculateCurrentStreakFromDays([
        makeDay(ymd(subDays(today, 2)), { exercises: [strength("Squat", [{ reps: 5, weight: 135 }])] }),
      ])
    ).toBe(0);
    expect(
      calculateLongestStreakFromDays([
        makeDay("2026-01-01", { isRestDay: true }),
        makeDay("2026-01-02", { exercises: [strength("Squat", [{ reps: 5, weight: 135 }])] }),
        makeDay("2026-01-04", { exercises: [strength("Squat", [{ reps: 5, weight: 135 }])] }),
      ])
    ).toBe(2);
  });

  it("filters recent days for week period", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recent = makeDay(ymd(today), { exercises: [strength("A", [{ reps: 1, weight: 1 }])] });
    const old = makeDay(ymd(subDays(today, 20)), { exercises: [strength("B", [{ reps: 1, weight: 1 }])] });
    expect(filterDaysByPeriod([recent, old], "all")).toHaveLength(2);
    expect(filterDaysByPeriod([recent, old], "week").map((day) => day.date)).toEqual([recent.date]);
  });

  it("finds PRs and favorite lifts", () => {
    const days = [
      makeDay("2026-01-01", { exercises: [strength("Bench Press", [{ reps: 5, weight: 135 }])] }),
      makeDay("2026-02-01", { exercises: [strength("Bench Press", [{ reps: 3, weight: 155 }])] }),
      makeDay("2026-02-02", { exercises: [strength("Squat", [{ reps: 5, weight: 185 }])] }),
    ];
    const prs = findAllPRs(days);
    const bench = prs.filter((pr) => pr.exerciseId === "Bench Press");
    expect(bench).toHaveLength(1);
    expect(bench[0]).toMatchObject({ prType: "maxWeight", value: 155 });
    expect(findFavoriteExerciseFromDays(days)).toBe("Bench Press");
    const collapsed = collapsePRsByExercise(prs);
    expect(collapsed.filter((pr) => pr.exerciseId === "Bench Press")).toHaveLength(1);
    expect(collapsed.find((pr) => pr.exerciseId === "Bench Press")?.prType).toBe("maxWeight");
  });

  it("keeps tracked cardio PRs when logs used the exercise name as id", () => {
    const catalog = [
      { id: "treadmill_run", name: "Treadmill Run" },
      { id: "running", name: "Running" },
      { id: "walk", name: "Walk" },
    ];
    const days = [
      makeDay("2026-01-01", {
        exercises: [
          { name: "Treadmill Run", modality: "cardio", cardioData: { duration: 1800, distance: 3 } },
          { name: "Running", modality: "cardio", cardioData: { duration: 1200, distance: 2 } },
          {
            exerciseId: "walk",
            name: "Walk",
            modality: "cardio",
            cardioData: { duration: 2400, distance: 2.5 },
          },
        ],
      }),
    ];
    const tracked = ["treadmill_run", "running", "walk"];
    const collapsed = collapsePRsByExercise(findAllPRs(days, tracked, catalog));
    const cardioIds = collapsed.filter((pr) => pr.modality === "cardio").map((pr) => pr.exerciseId).sort();
    expect(cardioIds).toEqual(["running", "treadmill_run", "walk"]);
  });

  it("tracks last vs previous working weight for a lift", () => {
    const days = [
      makeDay("2026-01-01", { exercises: [strength("Bench Press", [{ reps: 5, weight: 135 }])] }),
      makeDay("2026-01-08", { exercises: [strength("Bench Press", [{ reps: 5, weight: 145 }])] }),
    ];
    const progress = getLiftProgress(days, "Bench Press");
    expect(progress.last?.weight).toBe(145);
    expect(progress.previous?.weight).toBe(135);
    expect(progress.delta).toBe(10);
  });

  it("keeps one lift point per day when the same exercise is logged twice", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [
          strength("Bench Press", [{ reps: 5, weight: 135 }]),
          strength("Bench Press", [{ reps: 3, weight: 155 }]),
        ],
      }),
      makeDay("2026-01-08", { exercises: [strength("Bench Press", [{ reps: 5, weight: 145 }])] }),
    ];
    const progress = getLiftProgress(days, "Bench Press");
    expect(progress.points).toHaveLength(2);
    expect(progress.points[0].weight).toBe(155);
    expect(progress.last?.weight).toBe(145);
    expect(progress.previous?.weight).toBe(155);
    expect(progress.delta).toBe(-10);
  });

  it("ranks volume leaderboards including ties", () => {
    const alice = makeDay("2026-01-01", {
      userId: "alice",
      exercises: [strength("Bench", [{ reps: 5, weight: 100 }])],
    });
    const bob = makeDay("2026-01-01", {
      userId: "bob",
      exercises: [strength("Bench", [{ reps: 5, weight: 100 }])],
    });
    const cara = makeDay("2026-01-01", {
      userId: "cara",
      exercises: [strength("Bench", [{ reps: 5, weight: 200 }])],
    });
    const grouped = groupDaysByUserId([alice, bob, cara]);
    const board = getVolumeLeaderboard(grouped, "all");
    expect(board[0]).toMatchObject({ userId: "cara", rank: 1, value: 1000 });
    expect(board[1].rank).toBe(2);
    expect(board[2].rank).toBe(2);
    expect(getConsistencyLeaderboard(grouped, "all")[0].value).toBe(1);
    expect(getCardioDistanceLeaderboard(grouped, "all")[0].value).toBe(0);
  });

  it("summarizes workouts and calisthenics reps", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [{ name: "Pull-up", modality: "calisthenics", calisthenicsSets: [{ reps: 8 }, { reps: 6 }] }],
      }),
      makeDay("2026-01-02", { isRestDay: true }),
    ];
    expect(calculateTotalCalisthenicsRepsFromDays(days)).toBe(14);
    const summary = getAnalyticsSummaryFromDays(days);
    expect(summary.totalWorkouts).toBe(1);
    expect(summary.totalCalisthenicsReps).toBe(14);
    expect(summary.favoriteExercise).toBe("Pull-up");
  });

  it("builds volume points and strength/cardio analytics", () => {
    const days = [
      makeDay("2026-01-01", {
        exercises: [strength("Bench Press", [{ reps: 5, weight: 135 }])],
      }),
      makeDay("2026-01-02", {
        exercises: [
          {
            name: "Easy run",
            modality: "cardio",
            cardioData: { duration: 1800, distance: 3, activityType: "run" },
          },
        ],
      }),
    ];
    const points = getVolumeDataPoints(days, "all");
    expect(points.some((point) => point.volume === 675)).toBe(true);
    const strengthStats = getStrengthAnalytics(days, new Map(), "all");
    expect(strengthStats.totalVolume).toBe(675);
    expect(strengthStats.exercisesByFrequency[0]).toMatchObject({ name: "Bench Press", maxWeight: 135 });
    const cardio = getCardioAnalytics(days);
    expect(cardio.sessions).toBe(1);
    expect(cardio.byType[0].type).toBe("run");
    expect(cardio.byType[0].bestPace).toBe(600);
  });

  it("builds a bodyweight series and change from weigh-ins only", () => {
    const days = [
      makeDay("2026-01-01", { bodyweightLbs: 190 }),
      makeDay("2026-01-02", { exercises: [strength("Squat", [{ reps: 5, weight: 225 }])] }),
      makeDay("2026-01-04", { bodyweightLbs: 187.4 }),
    ];
    const points = getBodyweightPoints(days);
    expect(points).toEqual([
      { date: "2026-01-01", bodyweightLbs: 190 },
      { date: "2026-01-04", bodyweightLbs: 187.4 },
    ]);
    expect(getBodyweightChangeLbs(points)).toBeCloseTo(-2.6);
  });
});
