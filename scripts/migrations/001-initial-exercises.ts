import type { Firestore } from "firebase/firestore";
import { createExerciseService, type MuscleGroup, type ExerciseModality } from "../../packages/shared/firestore/exercises";
import exercisesData from "../../exercises.json";

export const migration = {
  version: 1,
  name: "Initial exercise seed",
  async up(db: Firestore) {
    const { seedExercises } = createExerciseService(db);
    await seedExercises(exercisesData as { name: string; muscleGroup?: MuscleGroup; modality?: ExerciseModality }[]);
  },
  async down(db: Firestore) {
    // Optional: remove exercises if needed
  }
};
