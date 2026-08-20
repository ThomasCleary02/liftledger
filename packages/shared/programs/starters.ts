import type { Exercise } from "../firestore/workouts";

export type StarterProgram = {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
};

const strength = (name: string, sets: number, reps: number, weight: number): Exercise => ({
  name,
  modality: "strength",
  strengthSets: Array.from({ length: sets }, () => ({ reps, weight })),
});

export const STARTER_PROGRAMS: StarterProgram[] = [
  {
    id: "ppl-push",
    name: "Push (PPL)",
    description: "Bench, overhead press, and triceps. Load onto a day and change the weights.",
    exercises: [
      strength("Bench Press", 3, 5, 135),
      strength("Overhead Press", 3, 8, 75),
      strength("Incline Dumbbell Press", 3, 10, 40),
      strength("Tricep Pushdown", 3, 12, 40),
    ],
  },
  {
    id: "ppl-pull",
    name: "Pull (PPL)",
    description: "Rows, pulldowns, and curls.",
    exercises: [
      strength("Barbell Row", 3, 5, 135),
      strength("Lat Pulldown", 3, 10, 100),
      strength("Face Pull", 3, 15, 30),
      strength("Barbell Curl", 3, 10, 45),
    ],
  },
  {
    id: "ppl-legs",
    name: "Legs (PPL)",
    description: "Squat, hinge, and calves.",
    exercises: [
      strength("Squat", 3, 5, 135),
      strength("Romanian Deadlift", 3, 8, 135),
      strength("Leg Press", 3, 10, 180),
      strength("Calf Raise", 3, 12, 100),
    ],
  },
  {
    id: "starting-strength",
    name: "Starting Strength A",
    description: "Squat, bench, and deadlift. Alternate with overhead press on B days.",
    exercises: [
      strength("Squat", 3, 5, 135),
      strength("Bench Press", 3, 5, 135),
      strength("Deadlift", 1, 5, 185),
    ],
  },
  {
    id: "five-three-one",
    name: "5/3/1 main lifts",
    description: "The four main lifts as a template. Set your own working weights.",
    exercises: [
      strength("Squat", 3, 5, 135),
      strength("Bench Press", 3, 5, 135),
      strength("Deadlift", 3, 5, 185),
      strength("Overhead Press", 3, 5, 75),
    ],
  },
];
