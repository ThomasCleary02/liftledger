// Types for analytics data
export type TimePeriod = "week" | "month" | "year" | "all";

export interface AnalyticsSummary {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  favoriteExercise?: string;
  totalVolume: number;
  totalCardioDistance: number;
  totalCardioDuration: number; // in seconds
  totalCalisthenicsReps: number;
}

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  modality: "strength" | "cardio" | "calisthenics";
  prType: "maxWeight" | "maxReps" | "maxVolume" | "maxDistance" | "maxDuration" | "bestPace";
  value: number;
  date: Date;
  workoutId: string;
}

export interface VolumeDataPoint {
  date: Date;
  volume: number;
  workoutCount: number;
}

export interface MuscleGroupStats {
  muscleGroup: string;
  volume: number;
  frequency: number; // number of workouts
  exercises: number; // unique exercises
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  modality: "strength" | "cardio" | "calisthenics";
  dataPoints: Array<{
    date: Date;
    value: number;
    label: string; // e.g., "225 lb", "5 mi", "20 reps"
  }>;
}

export interface StrengthPR {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  bestSet: { reps: number; weight: number; volume: number };
  date: Date;
  workoutId: string;
}

export interface CardioPR {
  exerciseId: string;
  exerciseName: string;
  maxDistance: number;
  maxDuration: number;
  bestPace: number;
  date: Date;
  workoutId: string;
}

export interface CalisthenicsPR {
  exerciseId: string;
  exerciseName: string;
  maxReps: number;
  maxDuration?: number;
  date: Date;
  workoutId: string;
}
