import { db } from "../firebase";
import {
  Timestamp,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  where,
  query,
  limit as limitFn,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { auth } from "../firebase";
import { ExerciseModality } from "./exercises";

// --------- Types ---------
export interface StrengthSetEntry {
  reps: number;
  weight: number;
}

export interface ListWorkoutsOptions {
  limit?: number;
  order?: "asc" | "desc";
}

export interface CardioEntry {
  duration: number;  // minutes or seconds
  distance?: number; // miles/km
  pace?: number;     // optional calculated field (e.g., min/mile)
}

export interface CalisthenicsSetEntry {
  reps: number;
  duration?: number; // for holds like planks (seconds)
}

export interface Exercise {
  exerciseId?: string; // canonical id for analytics (e.g., "bench_press")
  name: string;        // display name (frozen at log time)
  modality: ExerciseModality; // CRITICAL: store this with each logged exercise
  
  // Only ONE of these should be populated based on modality:
  strengthSets?: StrengthSetEntry[];
  cardioData?: CardioEntry;
  calisthenicsSets?: CalisthenicsSetEntry[];
}

export interface Workout {
  id: string;
  date: Timestamp;
  exercises: Exercise[];
  ownerId: string;

  // Optional denormalized summaries for faster lists/analytics
  totalVolume?: number;        // sum(reps*weight) for strength exercises only
  totalReps?: number;          // sum(reps) for strength/calisthenics
  totalCardioDuration?: number; // sum of cardio durations
  exerciseIds?: string[];      // unique ids used in this workout
}

export interface NewWorkoutInput {
  date?: Date | Timestamp;
  exercises: Exercise[];
}

const COLLECTION = "workouts";

// Firestore doc shape (converter handles normalization/back-compat)
type WorkoutDoc = {
  date: Timestamp;
  exercises: any[];
  ownerId: string;
  totalVolume?: number;
  totalReps?: number;
  totalCardioDuration?: number;
  exerciseIds?: string[];
};

// --------- Normalization (backward compatible) ---------
function normalizeExercise(ex: any): Exercise {
  const nameIn = typeof ex?.name === "string" ? ex.name : "Exercise";
  const idIn = typeof ex?.exerciseId === "string" ? ex.exerciseId : undefined;
  const modalityIn: ExerciseModality = ex?.modality || "strength"; // Default to strength for legacy

  // NEW: Handle modality-specific data
  if (modalityIn === "cardio") {
    // Cardio entry - new format
    if (ex?.cardioData && typeof ex.cardioData.duration === "number") {
      return {
        exerciseId: idIn,
        name: nameIn,
        modality: "cardio",
        cardioData: {
          duration: ex.cardioData.duration,
          distance: typeof ex.cardioData.distance === "number" ? ex.cardioData.distance : undefined,
          pace: typeof ex.cardioData.pace === "number" ? ex.cardioData.pace : undefined,
        }
      };
    }
    // NOTE: If you never stored cardio in legacy format, remove the legacy migration below
    // If you did store cardio incorrectly, consider a one-time migration script instead
    // Fallback cardio
    return { exerciseId: idIn, name: nameIn, modality: "cardio", cardioData: { duration: 0 } };
  }

  if (modalityIn === "calisthenics") {
    // Calisthenics entry - new format
    if (Array.isArray(ex?.calisthenicsSets)) {
      return {
        exerciseId: idIn,
        name: nameIn,
        modality: "calisthenics",
        calisthenicsSets: ex.calisthenicsSets
          .filter((s: any) => s && typeof s.reps === "number")
          .map((s: any) => ({
            reps: s.reps,
            duration: typeof s.duration === "number" ? s.duration : undefined,
          }))
      };
    }
    // Legacy: Convert sets to calisthenics (ignore weight)
    if (Array.isArray(ex?.sets)) {
      return {
        exerciseId: idIn,
        name: nameIn,
        modality: "calisthenics",
        calisthenicsSets: ex.sets
          .filter((s: any) => s && typeof s.reps === "number")
          .map((s: any) => ({ reps: s.reps }))
      };
    }
    return { exerciseId: idIn, name: nameIn, modality: "calisthenics", calisthenicsSets: [] };
  }

  // Strength (default) - check new format FIRST, then legacy formats
  // New format: strengthSets array
  if (Array.isArray(ex?.strengthSets)) {
    const sets = ex.strengthSets
      .filter((s: any) => s && typeof s.reps === "number" && typeof s.weight === "number")
      .map((s: any) => ({ reps: s.reps, weight: s.weight }));
    return { exerciseId: idIn, name: nameIn, modality: "strength", strengthSets: sets };
  }

  // Legacy: single set format (sets: number, reps: number, weight: number)
  if (typeof ex?.sets === "number" && typeof ex?.reps === "number" && typeof ex?.weight === "number") {
    return {
      exerciseId: idIn,
      name: nameIn,
      modality: "strength",
      strengthSets: [{ reps: ex.reps, weight: ex.weight }]
    };
  }

  // Legacy: array of sets
  if (Array.isArray(ex?.sets)) {
    const sets = ex.sets
      .filter((s: any) => s && typeof s.reps === "number" && typeof s.weight === "number")
      .map((s: any) => ({ reps: s.reps, weight: s.weight }));
    return { exerciseId: idIn, name: nameIn, modality: "strength", strengthSets: sets };
  }

  // Fallback strength
  return { exerciseId: idIn, name: nameIn, modality: "strength", strengthSets: [] };
}

// --------- Converter ---------
const converter = {
  toFirestore(data: WorkoutDoc) {
    return data;
  },
  fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): WorkoutDoc {
    const data: any = snap.data(options);
    const normalizedExercises: Exercise[] = Array.isArray(data?.exercises)
      ? data.exercises.map((ex: any) => normalizeExercise(ex))
      : [];

    const totalVolume = computeVolumeFromExercises(normalizedExercises);
    const totalReps = computeRepsFromExercises(normalizedExercises);
    const totalCardioDuration = computeCardioDurationFromExercises(normalizedExercises);
    const exerciseIds = Array.from(
      new Set(normalizedExercises.map(e => e.exerciseId).filter(Boolean) as string[])
    );

    return {
      date: data?.date instanceof Timestamp ? data.date : Timestamp.now(),
      exercises: normalizedExercises,
      ownerId: typeof data?.ownerId === "string" ? data.ownerId : "",
      totalVolume,
      totalReps,
      totalCardioDuration,
      exerciseIds,
    };
  },
};

// --------- Collection refs ---------
const workoutsCol = collection(db, COLLECTION).withConverter<WorkoutDoc>(converter);
const workoutDoc = (id: string) => doc(db, COLLECTION, id).withConverter<WorkoutDoc>(converter);

// --------- Helpers ---------
function toTimestamp(input?: Date | Timestamp): Timestamp {
  if (!input) return Timestamp.now();
  return input instanceof Timestamp ? input : Timestamp.fromDate(input);
}

function computeVolumeFromExercises(exercises: Exercise[]): number {
  // Only calculate volume for strength exercises
  return exercises.reduce((sum, ex) => {
    if (ex.modality === "strength" && Array.isArray(ex.strengthSets)) {
      const exVol = ex.strengthSets.reduce((s, st) => s + (st.reps || 0) * (st.weight || 0), 0);
      return sum + exVol;
    }
    return sum;
  }, 0);
}

function computeRepsFromExercises(exercises: Exercise[]): number {
  // Count reps for strength and calisthenics
  return exercises.reduce((sum, ex) => {
    if (ex.modality === "strength" && Array.isArray(ex.strengthSets)) {
      const exReps = ex.strengthSets.reduce((s, st) => s + (st.reps || 0), 0);
      return sum + exReps;
    }
    if (ex.modality === "calisthenics" && Array.isArray(ex.calisthenicsSets)) {
      const exReps = ex.calisthenicsSets.reduce((s, st) => s + (st.reps || 0), 0);
      return sum + exReps;
    }
    return sum;
  }, 0);
}

function computeCardioDurationFromExercises(exercises: Exercise[]): number {
  return exercises.reduce((sum, ex) => {
    if (ex.modality === "cardio" && ex.cardioData) {
      return sum + (ex.cardioData.duration || 0);
    }
    return sum;
  }, 0);
}

function summarizeExercises(exercises: Exercise[]) {
  const totalVolume = computeVolumeFromExercises(exercises);
  const totalReps = computeRepsFromExercises(exercises);
  const totalCardioDuration = computeCardioDurationFromExercises(exercises);
  const exerciseIds = Array.from(new Set(exercises.map(e => e.exerciseId).filter(Boolean) as string[]));
  return { totalVolume, totalReps, totalCardioDuration, exerciseIds };
}

// --------- CRUD + Subscribe ---------
export async function createWorkout(input: NewWorkoutInput): Promise<Workout> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const exercises = (input.exercises || []).map(normalizeExercise);
  const { totalVolume, totalReps, totalCardioDuration, exerciseIds } = summarizeExercises(exercises);

  const payload: WorkoutDoc = {
    date: toTimestamp(input.date),
    exercises,
    ownerId: uid,
    totalVolume,
    totalReps,
    totalCardioDuration,
    exerciseIds,
  } as WorkoutDoc;

  const ref = await addDoc(workoutsCol, payload);
  const s = await getDoc(workoutDoc(ref.id));
  const d = s.data() ?? payload;
  return {
    id: ref.id,
    date: d.date,
    exercises: d.exercises as Exercise[],
    ownerId: d.ownerId,
    totalVolume: d.totalVolume,
    totalReps: d.totalReps,
    totalCardioDuration: d.totalCardioDuration,
    exerciseIds: d.exerciseIds
  };
}

export async function updateWorkout(id: string, updates: Partial<Omit<Workout, "id">>): Promise<void> {
  const payload: Partial<WorkoutDoc> = {};
  if (updates.date) payload.date = toTimestamp(updates.date as any);
  if (updates.exercises) {
    const normalized = (updates.exercises as Exercise[]).map(normalizeExercise);
    const { totalVolume, totalReps, totalCardioDuration, exerciseIds } = summarizeExercises(normalized);
    payload.exercises = normalized as any[];
    payload.totalVolume = totalVolume;
    payload.totalReps = totalReps;
    payload.totalCardioDuration = totalCardioDuration;
    payload.exerciseIds = exerciseIds;
  }
  await updateDoc(workoutDoc(id), payload as WorkoutDoc);
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const s = await getDoc(workoutDoc(id));
  if (!s.exists()) return null;
  const d = s.data()!;
  return {
    id: s.id,
    date: d.date,
    exercises: d.exercises as Exercise[],
    ownerId: d.ownerId,
    totalVolume: d.totalVolume,
    totalReps: d.totalReps,
    totalCardioDuration: d.totalCardioDuration,
    exerciseIds: d.exerciseIds
  };
}

export async function deleteWorkout(id: string): Promise<void> {
  await deleteDoc(workoutDoc(id));
}

export async function listWorkouts({ limit, order = "desc" }: ListWorkoutsOptions = {}): Promise<Workout[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const constraints: any[] = [where("ownerId", "==", uid), orderBy("date", order)];
  if (limit && limit > 0) constraints.push(limitFn(limit));
  const q = query(workoutsCol, ...constraints);
  const res = await getDocs(q);
  return res.docs.map((d) => ({
    id: d.id,
    date: d.data().date,
    exercises: d.data().exercises as Exercise[],
    ownerId: d.data().ownerId,
    totalVolume: d.data().totalVolume,
    totalReps: d.data().totalReps,
    totalCardioDuration: d.data().totalCardioDuration,
    exerciseIds: d.data().exerciseIds,
  }));
}

export function subscribeToWorkouts(
  onChange: (workouts: Workout[]) => void,
  onError?: (err: Error) => void,
  options: Omit<ListWorkoutsOptions, "order"> & { order?: "asc" | "desc" } = {}
): Unsubscribe {
  const { limit, order = "desc" } = options;
  const uid = auth.currentUser?.uid;
  if (!uid) {
    onChange([]);
    return () => {};
  }
  const constraints: any[] = [where("ownerId", "==", uid), orderBy("date", order)];
  if (limit && limit > 0) constraints.push(limitFn(limit));
  const q = query(workoutsCol, ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs.map((d) => ({
          id: d.id,
          date: d.data().date,
          exercises: d.data().exercises as Exercise[],
          ownerId: d.data().ownerId,
          totalVolume: d.data().totalVolume,
          totalReps: d.data().totalReps,
          totalCardioDuration: d.data().totalCardioDuration,
          exerciseIds: d.data().exerciseIds,
        }))
      );
    },
    (e) => (onError ? onError(e as Error) : console.error("subscribeToWorkouts error:", e))
  );
}

// --------- Aggregations ---------
export function computeWorkoutVolume(workout: Workout): number {
  return computeVolumeFromExercises(workout.exercises || []);
}