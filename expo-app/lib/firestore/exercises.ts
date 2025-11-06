import { exerciseService } from "../firebase";
import type {
  MuscleGroup,
  ExerciseModality,
  ExerciseDoc,
} from "@liftledger/shared/firestore/exercises";

export const {
  seedExercises,
  getExercise,
  searchExercisesRemote,
  searchExercisesRemoteLegacy,
  getAllExercises,
} = exerciseService;

export type {
  MuscleGroup,
  ExerciseModality,
  ExerciseDoc,
};