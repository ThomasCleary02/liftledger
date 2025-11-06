


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

function calculateRelevanceScore(
  exercise: ExerciseDoc,
  query: string,
  queryWords: string[]
): number {
  const nameFolded = exercise.nameFolded;
  const queryFolded = foldName(query);
  let score = 0;

  // Exact match gets highest score
  if (nameFolded === queryFolded) {
    score += 1000;
  }
  // Starts with query (current behavior)
  else if (nameFolded.startsWith(queryFolded)) {
    score += 500;
  }
  // Contains query as substring
  else if (nameFolded.includes(queryFolded)) {
    score += 200;
  }
  // Fuzzy match - check if all query words appear somewhere
  else {
    const allWordsMatch = queryWords.every(word => 
      nameFolded.includes(word) || 
      exercise.muscleGroup?.toLowerCase().includes(word) ||
      exercise.modality.toLowerCase().includes(word)
    );
    if (allWordsMatch) {
      score += 100;
    }
  }

  // Boost score for word boundary matches
  queryWords.forEach(word => {
    // Word starts at beginning or after space/hyphen
    const wordBoundaryRegex = new RegExp(`(^|[-\\s])${word}`, 'i');
    if (wordBoundaryRegex.test(exercise.name)) {
      score += 50;
    }
    // Word appears in name
    if (nameFolded.includes(word)) {
      score += 20;
    }
    // Word matches muscle group
    if (exercise.muscleGroup?.toLowerCase().includes(word)) {
      score += 30;
    }
    // Word matches modality
    if (exercise.modality.toLowerCase().includes(word)) {
      score += 10;
    }
  });

  // Equipment/keyword matching
  const equipmentKeywords: Record<string, string[]> = {
    'smith': ['smith machine', 'smith'],
    'cable': ['cable', 'cables'],
    'dumbbell': ['dumbbell', 'db', 'dumbbells'],
    'barbell': ['barbell', 'bb', 'bar'],
    'machine': ['machine'],
    'bench': ['bench'],
    'press': ['press'],
    'curl': ['curl'],
    'fly': ['fly', 'flye'],
    'row': ['row', 'rowing'],
    'pulldown': ['pulldown', 'pull down'],
    'squat': ['squat'],
    'deadlift': ['deadlift', 'dl'],
    'lunge': ['lunge'],
  };

  Object.entries(equipmentKeywords).forEach(([equipment, keywords]) => {
    if (keywords.some(kw => queryFolded.includes(kw))) {
      if (nameFolded.includes(equipment)) {
        score += 40;
      }
    }
  });

  // Abbreviation matching
  const abbreviations: Record<string, string[]> = {
    'bp': ['bench press'],
    'db': ['dumbbell'],
    'bb': ['barbell'],
    'ohp': ['overhead press', 'shoulder press'],
    'rdl': ['romanian deadlift'],
    'dl': ['deadlift'],
  };

  Object.entries(abbreviations).forEach(([abbr, expansions]) => {
    if (queryFolded === abbr || queryFolded.startsWith(abbr + ' ')) {
      expansions.forEach(exp => {
        if (nameFolded.includes(exp)) {
          score += 60;
        }
      });
    }
  });

  return score;
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
      const queryWords = qFold.split(/\s+/).filter(w => w.length > 0);

      // Fetch all exercises (or filtered by muscle group if provided)
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

      // Modality filter
      if (filters?.modality) {
        filtered = filtered.filter(d => d.modality === filters.modality);
      }

      // Semantic search with scoring
      if (qFold) {
        // Calculate relevance scores
        const scored = filtered.map(ex => ({
          exercise: ex,
          score: calculateRelevanceScore(ex, queryText, queryWords)
        }));

        // Filter out zero-score results and sort by score (descending)
        filtered = scored
          .filter(item => item.score > 0)
          .sort((a, b) => {
            // First by score
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            // Then alphabetically for same score
            return a.exercise.nameFolded.localeCompare(b.exercise.nameFolded);
          })
          .map(item => item.exercise);
      } else {
        // No query - just sort alphabetically
        filtered.sort((a, b) => a.nameFolded.localeCompare(b.nameFolded));
      }

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
