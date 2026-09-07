import type { ExerciseDoc } from "./firestore/exercises";
import type { Exercise } from "./firestore/workouts";
import type { Day } from "./firestore/days";

export function foldExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Near-duplicate catalog labels that should share PR / tracking identity.
 * Does not merge run↔walk or equipment variants like barbell↔Smith.
 */
export function exerciseNameAliases(folded: string): string[] {
  const aliases = new Set<string>([folded]);
  if (folded === "run" || folded === "running" || folded === "jog" || folded === "jogging") {
    aliases.add("run");
    aliases.add("running");
    aliases.add("jog");
    aliases.add("jogging");
  }
  if (folded === "walk" || folded === "walking") {
    aliases.add("walk");
    aliases.add("walking");
  }
  // Treadmill (often logged) ↔ Treadmill Run (catalog / display "Run · Treadmill")
  if (
    folded === "treadmill" ||
    folded === "treadmill run" ||
    folded === "run treadmill" ||
    folded === "treadmill jogging" ||
    folded === "treadmill jog"
  ) {
    aliases.add("treadmill");
    aliases.add("treadmill run");
    aliases.add("run treadmill");
  }
  return Array.from(aliases);
}

export type CatalogIndexes = {
  nameById: Map<string, string>;
  idByNameFolded: Map<string, string>;
  modalityById: Map<string, ExerciseDoc["modality"]>;
};

export function buildCatalogIndexes(
  catalog?: Array<Pick<ExerciseDoc, "id" | "name"> & { modality?: ExerciseDoc["modality"] }>
): CatalogIndexes {
  const nameById = new Map<string, string>();
  const idByNameFolded = new Map<string, string>();
  const modalityById = new Map<string, ExerciseDoc["modality"]>();
  for (const ex of catalog ?? []) {
    if (!ex?.id || !ex?.name) continue;
    nameById.set(ex.id, ex.name);
    if (ex.modality) modalityById.set(ex.id, ex.modality);
    for (const key of exerciseNameAliases(foldExerciseName(ex.name))) {
      if (!idByNameFolded.has(key)) idByNameFolded.set(key, ex.id);
    }
    for (const key of exerciseNameAliases(foldExerciseName(ex.id))) {
      if (!idByNameFolded.has(key)) idByNameFolded.set(key, ex.id);
    }
  }
  return { nameById, idByNameFolded, modalityById };
}

function lookupCatalogId(folded: string, idByNameFolded: Map<string, string>): string | undefined {
  for (const key of exerciseNameAliases(folded)) {
    const id = idByNameFolded.get(key);
    if (id) return id;
  }
  return undefined;
}

/** Prefer explicit modality; fall back so legacy cardio rows without modality still count. */
export function resolveExerciseModality(ex: Exercise): Exercise["modality"] {
  if (ex.modality === "cardio" || ex.modality === "calisthenics" || ex.modality === "strength") {
    return ex.modality;
  }
  if (ex.cardioData) return "cardio";
  if (ex.calisthenicsSets && ex.calisthenicsSets.length > 0) return "calisthenics";
  return "strength";
}

/**
 * Prefer catalog ids so legacy name-only logs and label drift still match My exercises.
 * Known twins (Run/Running, Treadmill/Treadmill Run, …) collapse to one catalog id.
 */
export function resolveExerciseKey(
  ex: Pick<Exercise, "exerciseId" | "name">,
  indexes: CatalogIndexes
): string {
  const { nameById, idByNameFolded } = indexes;
  const folded = foldExerciseName(ex.name || "");
  const fromName = folded ? lookupCatalogId(folded, idByNameFolded) : undefined;

  if (ex.exerciseId) {
    const idFolded = foldExerciseName(ex.exerciseId);
    const fromId = lookupCatalogId(idFolded, idByNameFolded);
    // Prefer alias-resolved catalog id so treadmill ↔ treadmill_run share a key.
    if (fromId) return fromId;
    if (nameById.has(ex.exerciseId)) return ex.exerciseId;
  }
  if (fromName) return fromName;
  if (ex.exerciseId) return ex.exerciseId;
  return ex.name;
}

export function expandTrackedAllowList(
  trackedExerciseIds: string[],
  indexes: CatalogIndexes
): Set<string> {
  const { nameById, idByNameFolded } = indexes;
  const allowed = new Set<string>();
  for (const id of trackedExerciseIds) {
    allowed.add(id);
    const name = nameById.get(id);
    if (name) {
      allowed.add(name);
      for (const key of exerciseNameAliases(foldExerciseName(name))) {
        allowed.add(key);
        const aliasId = idByNameFolded.get(key);
        if (aliasId) allowed.add(aliasId);
      }
    }
    for (const key of exerciseNameAliases(foldExerciseName(id))) {
      allowed.add(key);
      const aliasId = idByNameFolded.get(key);
      if (aliasId) allowed.add(aliasId);
    }
  }
  return allowed;
}

export function prMatchesAllowList(
  pr: { exerciseId: string; exerciseName: string },
  allowed: Set<string>,
  indexes: CatalogIndexes
): boolean {
  if (allowed.has(pr.exerciseId) || allowed.has(pr.exerciseName)) return true;
  for (const key of exerciseNameAliases(foldExerciseName(pr.exerciseName))) {
    if (allowed.has(key)) return true;
    const canon = indexes.idByNameFolded.get(key);
    if (canon && allowed.has(canon)) return true;
  }
  for (const key of exerciseNameAliases(foldExerciseName(pr.exerciseId))) {
    if (allowed.has(key)) return true;
    const canon = indexes.idByNameFolded.get(key);
    if (canon && allowed.has(canon)) return true;
  }
  return false;
}

export type LoggedExerciseSummary = {
  exerciseId: string;
  name: string;
  modality: Exercise["modality"];
  sessionCount: number;
  lastDate: string;
};

export function summarizeLoggedExercises(
  days: Day[],
  catalog?: Array<Pick<ExerciseDoc, "id" | "name"> & { modality?: ExerciseDoc["modality"] }>
): LoggedExerciseSummary[] {
  const indexes = buildCatalogIndexes(catalog);
  const byId = new Map<
    string,
    { name: string; modality: Exercise["modality"]; dates: Set<string> }
  >();

  for (const day of days) {
    if (!day?.date || !Array.isArray(day.exercises)) continue;
    for (const ex of day.exercises) {
      if (!ex?.name && !ex?.exerciseId) continue;
      const exerciseId = resolveExerciseKey(ex, indexes);
      const modality = resolveExerciseModality(ex);
      const name = indexes.nameById.get(exerciseId) || ex.name || exerciseId;
      const current = byId.get(exerciseId) || {
        name,
        modality: indexes.modalityById.get(exerciseId) || modality,
        dates: new Set<string>(),
      };
      current.dates.add(day.date);
      current.name = name;
      byId.set(exerciseId, current);
    }
  }

  return Array.from(byId.entries())
    .map(([exerciseId, row]) => {
      const dates = Array.from(row.dates).sort();
      return {
        exerciseId,
        name: row.name,
        modality: row.modality,
        sessionCount: row.dates.size,
        lastDate: dates[dates.length - 1] || "",
      };
    })
    .sort((a, b) => {
      if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
      return b.lastDate.localeCompare(a.lastDate);
    });
}

const SUGGESTION_STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "with",
  "press",
  "machine",
]);

type CardioFamily = "run" | "walk" | "other";

function cardioFamily(id: string, name: string): CardioFamily {
  const text = foldExerciseName(`${id} ${name}`);
  if (/\bwalk/.test(text)) return "walk";
  if (/(treadmill|\brun\b|\brunning\b|\bjog\b|\bjogging\b|\bsprint\b)/.test(text)) return "run";
  return "other";
}

function tokensFor(id: string, name: string): Set<string> {
  const text = foldExerciseName(`${id} ${name}`);
  return new Set(
    text
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !SUGGESTION_STOP.has(t))
  );
}

export type TrackedMatchStatus = {
  trackedId: string;
  trackedName: string;
  hasMatchingHistory: boolean;
  suggestions: LoggedExerciseSummary[];
};

export function trackedMatchStatuses(
  trackedIds: string[],
  logged: LoggedExerciseSummary[],
  catalog?: Array<Pick<ExerciseDoc, "id" | "name"> & { modality?: ExerciseDoc["modality"] }>
): TrackedMatchStatus[] {
  const indexes = buildCatalogIndexes(catalog);
  const loggedById = new Map(logged.map((row) => [row.exerciseId, row]));
  const trackedSet = new Set(trackedIds);

  return trackedIds.map((trackedId) => {
    const trackedName = indexes.nameById.get(trackedId) || trackedId;
    const resolved = resolveExerciseKey({ exerciseId: trackedId, name: trackedName }, indexes);
    const hasMatchingHistory = loggedById.has(resolved) || loggedById.has(trackedId);

    const trackedTokens = tokensFor(trackedId, trackedName);
    const trackedModality = indexes.modalityById.get(trackedId) || indexes.modalityById.get(resolved);
    const trackedFamily = cardioFamily(trackedId, trackedName);

    const suggestions = hasMatchingHistory
      ? []
      : logged
          .filter((row) => !trackedSet.has(row.exerciseId) && row.exerciseId !== resolved)
          .filter((row) => !trackedModality || row.modality === trackedModality)
          .map((row) => {
            const rowTokens = tokensFor(row.exerciseId, row.name);
            let overlap = 0;
            trackedTokens.forEach((t) => {
              if (rowTokens.has(t)) overlap += 1;
            });
            const family =
              trackedModality === "cardio" &&
              trackedFamily !== "other" &&
              cardioFamily(row.exerciseId, row.name) === trackedFamily
                ? 1
                : 0;
            return { row, score: overlap + family };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score || b.row.sessionCount - a.row.sessionCount)
          .slice(0, 3)
          .map((x) => x.row);

    return {
      trackedId,
      trackedName,
      hasMatchingHistory,
      suggestions,
    };
  });
}
