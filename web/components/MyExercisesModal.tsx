"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { searchExerciseCatalog } from "@liftledger/shared/firestore/exercises";
import { trackedMatchStatuses, type LoggedExerciseSummary } from "@liftledger/shared";
import { format, parseISO } from "date-fns";
import { FullScreenSheet } from "./FullScreenSheet";
import { ExerciseNameLabel } from "./ExerciseNameLabel";
import type { ExerciseDoc } from "../lib/firestore/exercises";

function shortLastDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function MyExercisesModal({
  open,
  trackedExercises,
  allExercises,
  loggedSummaries = [],
  historyLoading = false,
  loading,
  onClose,
  onSave,
}: {
  open: boolean;
  trackedExercises: string[];
  allExercises: ExerciseDoc[];
  loggedSummaries?: LoggedExerciseSummary[];
  historyLoading?: boolean;
  loading: boolean;
  onClose: () => void;
  onSave: (exerciseIds: string[]) => Promise<void>;
}) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>(trackedExercises);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const savingRef = useRef(false);
  const selectedRef = useRef(selectedExercises);
  selectedRef.current = selectedExercises;

  useEffect(() => {
    if (open) {
      setSelectedExercises(trackedExercises);
      setSearchQuery("");
      setAdding(false);
      savingRef.current = false;
    }
  }, [open, trackedExercises]);

  const byId = useMemo(() => new Map(allExercises.map((ex) => [ex.id, ex])), [allExercises]);
  const loggedById = useMemo(
    () => new Map(loggedSummaries.map((row) => [row.exerciseId, row])),
    [loggedSummaries]
  );

  const matchById = useMemo(() => {
    const statuses = trackedMatchStatuses(selectedExercises, loggedSummaries, allExercises);
    return new Map(statuses.map((status) => [status.trackedId, status]));
  }, [selectedExercises, loggedSummaries, allExercises]);

  const selectedDocs = useMemo(() => {
    return selectedExercises.map((id) => {
      const logged = loggedById.get(id);
      const catalog = byId.get(id);
      const match = matchById.get(id);
      return {
        id,
        name: catalog?.name || logged?.name || id,
        modality: catalog?.modality || logged?.modality || ("strength" as const),
        sessionCount: logged?.sessionCount ?? 0,
        hasMatchingHistory: match?.hasMatchingHistory ?? logged != null,
        suggestions: match?.suggestions ?? [],
      };
    });
  }, [selectedExercises, byId, loggedById, matchById]);

  const addCandidates = useMemo(() => {
    const selected = new Set(selectedExercises);
    const remaining = allExercises.filter((ex) => !selected.has(ex.id));
    const searched = searchExerciseCatalog(remaining, searchQuery, undefined, 80);
    const loggedIds = new Set(
      loggedSummaries.filter((row) => !selected.has(row.exerciseId)).map((row) => row.exerciseId)
    );

    const loggedHits: ExerciseDoc[] = [];
    const catalogHits: ExerciseDoc[] = [];
    for (const ex of searched) {
      if (loggedIds.has(ex.id)) loggedHits.push(ex);
      else catalogHits.push(ex);
    }

    if (!searchQuery.trim()) {
      const seen = new Set(loggedHits.map((ex) => ex.id));
      for (const row of loggedSummaries) {
        if (selected.has(row.exerciseId) || seen.has(row.exerciseId)) continue;
        const doc = byId.get(row.exerciseId) || {
          id: row.exerciseId,
          name: row.name,
          modality: row.modality,
          nameFolded: row.name.toLowerCase(),
        };
        loggedHits.push(doc);
        seen.add(row.exerciseId);
      }
      loggedHits.sort((a, b) => {
        const ca = loggedById.get(a.id)?.sessionCount ?? 0;
        const cb = loggedById.get(b.id)?.sessionCount ?? 0;
        return cb - ca;
      });
    }

    return { loggedHits, catalogHits };
  }, [allExercises, selectedExercises, searchQuery, loggedSummaries, byId, loggedById]);

  const persistAndClose = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await onSave(selectedRef.current);
      onClose();
    } catch {
      savingRef.current = false;
    }
  };

  const handleSheetClose = () => {
    if (adding) {
      setAdding(false);
      setSearchQuery("");
      return;
    }
    void persistAndClose();
  };

  const swapTracked = (fromId: string, toId: string) => {
    setSelectedExercises((prev) => {
      const without = prev.filter((id) => id !== fromId && id !== toId);
      return [...without, toId];
    });
  };

  const renderAddRow = (exercise: ExerciseDoc) => {
    const logged = loggedById.get(exercise.id);
    return (
      <button
        key={exercise.id}
        type="button"
        onClick={() => {
          setSelectedExercises((prev) =>
            prev.includes(exercise.id) ? prev : [...prev, exercise.id]
          );
          setAdding(false);
          setSearchQuery("");
        }}
        className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
      >
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            <ExerciseNameLabel name={exercise.name} />
          </p>
          <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {logged
              ? `${logged.sessionCount} session${logged.sessionCount === 1 ? "" : "s"} · last ${shortLastDate(logged.lastDate)}`
              : exercise.modality}
          </p>
        </div>
      </button>
    );
  };

  return (
    <FullScreenSheet
      open={open}
      title={adding ? "Add exercise" : "My exercises"}
      closeText={adding ? "Back" : "Done"}
      onClose={handleSheetClose}
    >
      {adding ? (
        <>
          <p className="mb-4 text-gray-600 dark:text-gray-300">Pick exercises to track for PRs.</p>
          <input
            type="text"
            placeholder="Search exercises"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-950"
          />
          <div className="space-y-4">
            {loading || historyLoading ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading exercises...</p>
            ) : addCandidates.loggedHits.length === 0 && addCandidates.catalogHits.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">No exercises found.</p>
            ) : (
              <>
                {addCandidates.loggedHits.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Logged
                    </p>
                    {addCandidates.loggedHits.map(renderAddRow)}
                  </div>
                ) : null}
                {addCandidates.catalogHits.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Catalog
                    </p>
                    {addCandidates.catalogHits.map(renderAddRow)}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Exercises you track for PRs. Done saves your list.
          </p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mb-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 hover:border-brand hover:bg-brand/5 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
          >
            <Plus className="h-5 w-5" />
            Add exercise
          </button>
          <div className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading exercises...</p>
            ) : selectedDocs.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Nothing tracked yet.</p>
            ) : (
              selectedDocs.map((exercise) => {
                const showNoHistory = !historyLoading && !exercise.hasMatchingHistory;
                return (
                  <div
                    key={exercise.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          <ExerciseNameLabel name={exercise.name} />
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {showNoHistory
                            ? "Not in your history"
                            : exercise.sessionCount > 0
                              ? `${exercise.sessionCount} session${exercise.sessionCount === 1 ? "" : "s"} · ${exercise.modality}`
                              : exercise.modality}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedExercises((prev) => prev.filter((id) => id !== exercise.id))
                        }
                        className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        aria-label={`Remove ${exercise.name}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {showNoHistory && exercise.suggestions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {exercise.suggestions.map((suggestion) => (
                          <button
                            key={suggestion.exerciseId}
                            type="button"
                            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                            onClick={() => swapTracked(exercise.id, suggestion.exerciseId)}
                          >
                            Use {suggestion.name} instead
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </FullScreenSheet>
  );
}
