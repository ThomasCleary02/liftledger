import { exerciseService } from "../firebase";
import { searchExerciseCatalog } from "@liftledger/shared/firestore/exercises";
import type {
  MuscleGroup,
  ExerciseModality,
  ExerciseDoc,
} from "@liftledger/shared/firestore/exercises";
import { peekCatalog, peekExercise, rememberCatalog } from "../sessionCache";

let catalogInflight: Promise<ExerciseDoc[]> | null = null;

async function loadCatalog(): Promise<ExerciseDoc[]> {
  const cached = peekCatalog();
  if (cached) return cached;
  if (catalogInflight) return catalogInflight;
  catalogInflight = exerciseService
    .getAllExercises()
    .then((docs) => {
      rememberCatalog(docs);
      catalogInflight = null;
      return docs;
    })
    .catch((error) => {
      catalogInflight = null;
      throw error;
    });
  return catalogInflight;
}

export const seedExercises = exerciseService.seedExercises.bind(exerciseService);

export async function getExercise(id: string): Promise<ExerciseDoc | null> {
  const cached = peekExercise(id);
  if (cached !== undefined) return cached;
  const fromCatalog = (await loadCatalog()).find((ex) => ex.id === id);
  if (fromCatalog) return fromCatalog;
  return exerciseService.getExercise(id);
}

export async function searchExercisesRemote(
  queryText: string,
  filters?: { muscleGroup?: MuscleGroup; modality?: ExerciseModality },
  limitCount = 50
): Promise<ExerciseDoc[]> {
  const all = await loadCatalog();
  return searchExerciseCatalog(all, queryText, filters, limitCount);
}

export async function searchExercisesRemoteLegacy(
  queryText: string,
  muscleGroup?: MuscleGroup,
  limitCount = 50
): Promise<ExerciseDoc[]> {
  return searchExercisesRemote(queryText, { muscleGroup }, limitCount);
}

export async function getAllExercises(): Promise<ExerciseDoc[]> {
  return loadCatalog();
}

export type { MuscleGroup, ExerciseModality, ExerciseDoc };
