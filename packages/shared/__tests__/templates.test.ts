import { describe, expect, it } from "vitest";
import { cloneExercisesForTemplate } from "../firestore/workoutTemplates";
import type { Exercise } from "../firestore/workouts";

describe("cloneExercisesForTemplate", () => {
  it("omits undefined optional fields so Firestore addDoc will accept the payload", () => {
    const input: Exercise[] = [
      {
        name: "Bench Press",
        modality: "strength",
        exerciseId: "bench_press",
        strengthSets: [{ reps: 5, weight: 135 }, { reps: 5, weight: 135, warmup: true }],
      },
      {
        name: "Pull-up",
        modality: "calisthenics",
        calisthenicsSets: [{ reps: 8 }, { reps: 6, duration: 30, addedWeight: 10 }],
      },
      {
        name: "Run",
        modality: "cardio",
        cardioData: { duration: 1200, distance: 2, activityType: "run" },
      },
    ];
    const cloned = cloneExercisesForTemplate(input);
    expect(cloned[0].exerciseId).toBe("bench_press");
    expect(cloned[0].strengthSets?.[1]).toEqual({ reps: 5, weight: 135, warmup: true });
    expect(cloned[1].calisthenicsSets?.[0]).toEqual({ reps: 8 });
    expect("duration" in (cloned[1].calisthenicsSets?.[0] || {})).toBe(false);
    expect(cloned[1].calisthenicsSets?.[1]).toEqual({ reps: 6, duration: 30, addedWeight: 10 });
    expect(cloned[2].cardioData).toEqual({ duration: 1200, distance: 2, activityType: "run" });
    expect(JSON.stringify(cloned).includes("undefined")).toBe(false);
  });
});
