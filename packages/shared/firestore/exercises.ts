


// Similar pattern - accept db as parameter
import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitFn,
  setDoc,
  QueryDocumentSnapshot,
  SnapshotOptions
} from "firebase/firestore";

export type MuscleGroup =
  | "chest" | "shoulders" | "biceps" | "triceps" | "legs" | "back"
  | "glutes" | "abs" | "calves"
  | "forearms_flexors" | "forearms_extensors"
  | "neck"
  | "full_body"; // Changed from "cardio" - cardio isn't a muscle group

export type ExerciseModality = "strength" | "cardio" | "calisthenics";

export type ExerciseDoc = {
  id: string;
  name: string;
  muscleGroup?: MuscleGroup; // Made optional for cardio exercises
  nameFolded: string;
  modality: ExerciseModality;
};

const COLLECTION = "exercises";

function foldName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function inferModality(group: MuscleGroup | undefined, name: string): ExerciseModality {
  // If explicitly marked as cardio (or no muscle group), assume cardio
  if (!group || group === "full_body") {
    // Check name for cardio keywords
    const n = (name || "").toLowerCase();
    const cardioKeywords = ["run", "jog", "bike", "cycle", "row", "swim", "walk", "treadmill", "elliptical", "stair", "sprint"];
    if (cardioKeywords.some(kw => n.includes(kw))) {
      return "cardio";
    }
  }

  const n = (name || "").toLowerCase();
  
  // Expanded bodyweight detection
  const bodyweightKeywords = [
    "push-up", "pushup", "pull-up", "pullup", "chin-up", "chinup",
    "dip", "plank", "burpee", "jumping", "air squat", "mountain climber",
    "handstand", "muscle-up", "muscleup", "l-sit", "lsit",
    "sit-up", "situp", "crunch", "leg raise", "hanging"
  ];

  if (bodyweightKeywords.some(kw => n.includes(kw))) {
    return "calisthenics";
  }

  return "strength";
}

export function createExerciseService(db: Firestore) {
  const converter = {
    toFirestore(d: ExerciseDoc) {
      return d;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): ExerciseDoc {
      const data: any = snap.data(options);
      const mg = data?.muscleGroup as MuscleGroup | undefined;
      const m: ExerciseModality =
        data?.modality === "cardio" || data?.modality === "calisthenics" ? data.modality : "strength";
      return {
        id: snap.id,
        name: String(data?.name ?? ""),
        muscleGroup: mg,
        nameFolded: String(data?.nameFolded ?? ""),
        modality: m
      };
    }
  };

  const exercisesCol = collection(db, COLLECTION).withConverter<ExerciseDoc>(converter);
  const exerciseRef = (id: string) => doc(db, COLLECTION, id).withConverter<ExerciseDoc>(converter);

  return {
    async seedExercises(
      items: { name: string; muscleGroup?: MuscleGroup; modality?: ExerciseModality }[]
    ): Promise<void> {
      const seenIds = new Set<string>();
      const duplicates: string[] = [];

      for (const it of items) {
        const id = slugify(it.name);

        if (seenIds.has(id)) {
          duplicates.push(`"${it.name}" -> ${id}`);
          console.warn(`Duplicate exercise ID: ${id} for "${it.name}"`);
          continue; // Skip duplicates
        }
        seenIds.add(id);

        const modality = it.modality ?? inferModality(it.muscleGroup, it.name);
        await setDoc(exerciseRef(id), {
          id,
          name: it.name,
          muscleGroup: it.muscleGroup,
          nameFolded: foldName(it.name),
          modality
        });
      }

      if (duplicates.length > 0) {
        console.warn(`Skipped ${duplicates.length} duplicate exercises:`, duplicates);
      }
    },

    async getExercise(id: string): Promise<ExerciseDoc | null> {
      const s = await getDoc(exerciseRef(id));
      return s.exists() ? (s.data() as ExerciseDoc) : null;
    },

    async searchExercisesRemote(
      queryText: string,
      filters?: { muscleGroup?: MuscleGroup; modality?: ExerciseModality },
      limitCount = 50
    ): Promise<ExerciseDoc[]> {
      const qFold = foldName(queryText).trim();

      // Fetch all exercises (or filtered by muscle group if provided)
      // For hundreds of exercises, in-memory filtering is fine and avoids index management
      let allDocs: ExerciseDoc[];

      if (filters?.muscleGroup) {
        const res = await getDocs(
          query(exercisesCol, where("muscleGroup", "==", filters.muscleGroup))
        );
        allDocs = res.docs.map(d => d.data());
      } else {
        const res = await getDocs(exercisesCol);
        allDocs = res.docs.map(d => d.data());
      }

      // Filter in-memory
      let filtered = allDocs;

      // Text prefix filter
      if (qFold) {
        filtered = filtered.filter(d => d.nameFolded.startsWith(qFold));
      }

      // Modality filter
      if (filters?.modality) {
        filtered = filtered.filter(d => d.modality === filters.modality);
      }

      // Sort and limit
      filtered.sort((a, b) => a.nameFolded.localeCompare(b.nameFolded));
      return filtered.slice(0, Math.max(1, Math.min(200, limitCount)));
    },

    async searchExercisesRemoteLegacy(
      queryText: string,
      muscleGroup?: MuscleGroup,
      limitCount = 50
    ): Promise<ExerciseDoc[]> {
      return this.searchExercisesRemote(queryText, { muscleGroup }, limitCount);
    },

    async getAllExercises(): Promise<ExerciseDoc[]> {
      const res = await getDocs(exercisesCol);
      return res.docs.map(d => d.data());
    },
  };
}
