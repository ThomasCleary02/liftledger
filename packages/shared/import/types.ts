import type { Exercise } from "../firestore/workouts";
import type { ExerciseModality } from "../firestore/exercises";
import type { CardioActivityType } from "../cardio";

export type WeightUnit = "lb" | "kg";
export type DistanceUnit = "mi" | "km";

export type ImportRow = {
  date: string;
  exerciseName: string;
  setIndex: number;
  reps?: number;
  weightLbs?: number;
  durationSeconds?: number;
  distanceMiles?: number;
  notes?: string;
  workoutName?: string;
  cardioType?: CardioActivityType;
  restDay?: boolean;
  warmup?: boolean;
  modality?: ExerciseModality;
};

export type DetectedFormat = "strong" | "hevy" | "liftledger" | "unknown";

export type ColumnMapping = {
  date: string;
  exercise: string;
  reps?: string;
  weight?: string;
  set?: string;
  duration?: string;
  distance?: string;
  notes?: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  durationIsMinutes?: boolean;
};

export type ImportPreview = {
  format: DetectedFormat;
  headers: string[];
  rows: ImportRow[];
  dayCount: number;
  setCount: number;
  dateMin?: string;
  dateMax?: string;
  sample: ImportRow[];
  weightUnitGuess: WeightUnit;
  distanceUnitGuess: DistanceUnit;
  warnings: string[];
  dateOrder?: "mdy" | "dmy" | "ambiguous" | "iso";
};

export type ImportedDay = {
  date: string;
  isRestDay: boolean;
  notes?: string;
  exercises: Exercise[];
};

export type { Exercise, ExerciseModality };
