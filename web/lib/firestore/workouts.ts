import { workoutService } from "../firebase";
import type {
  StrengthSetEntry,
  CardioEntry,
  CalisthenicsSetEntry,
  Exercise,
  Workout,
  NewWorkoutInput,
  ListWorkoutsOptions,
} from "@liftledger/shared/firestore/workouts";

export const {
  createWorkout,
  updateWorkout,
  getWorkout,
  deleteWorkout,
  listWorkouts,
  subscribeToWorkouts,
  computeWorkoutVolume,
} = workoutService;

export type {
  StrengthSetEntry,
  CardioEntry,
  CalisthenicsSetEntry,
  Exercise,
  Workout,
  NewWorkoutInput,
  ListWorkoutsOptions,
};
