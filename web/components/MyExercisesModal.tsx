"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { searchExerciseCatalog } from "@liftledger/shared/firestore/exercises";
import { FullScreenSheet } from "./FullScreenSheet";
import { ExerciseNameLabel } from "./ExerciseNameLabel";
import type { ExerciseDoc } from "../lib/firestore/exercises";

export function MyExercisesModal({
  open,
  trackedExercises,
  allExercises,
  loading,
  onClose,
  onSave,
}: {
  open: boolean;
  trackedExercises: string[];
  allExercises: ExerciseDoc[];
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

  const selectedDocs = useMemo(() => {
    return selectedExercises.map((id) => byId.get(id) ?? { id, name: id, modality: "strength" as const, nameFolded: id });
  }, [selectedExercises, byId]);

  const addCandidates = useMemo(() => {
    const selected = new Set(selectedExercises);
    const remaining = allExercises.filter((ex) => !selected.has(ex.id));
    return searchExerciseCatalog(remaining, searchQuery, undefined, 80);
  }, [allExercises, selectedExercises, searchQuery]);

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

  return (
    <FullScreenSheet
      open={open}
      title={adding ? "Add exercise" : "My exercises"}
      closeText={adding ? "Back" : "Done"}
      onClose={handleSheetClose}
    >
      {adding ? (
        <>
          <p className="mb-4 text-gray-600">Pick exercises to track for PRs.</p>
          <input
            type="text"
            placeholder="Search exercises"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand focus:bg-white"
          />
          <div className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-gray-500">Loading exercises...</p>
            ) : addCandidates.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No exercises found.</p>
            ) : (
              addCandidates.map((exercise) => (
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
                  className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      <ExerciseNameLabel name={exercise.name} />
                    </p>
                    <p className="text-xs capitalize text-gray-500">{exercise.modality}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-gray-600">Exercises you track for PRs. Done saves your list.</p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mb-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 hover:border-brand hover:bg-brand/5"
          >
            <Plus className="h-5 w-5" />
            Add exercise
          </button>
          <div className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-gray-500">Loading exercises...</p>
            ) : selectedDocs.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Nothing tracked yet.</p>
            ) : (
              selectedDocs.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-gray-900">
                      <ExerciseNameLabel name={exercise.name} />
                    </p>
                    {"modality" in exercise && exercise.modality ? (
                      <p className="text-xs capitalize text-gray-500">{exercise.modality}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedExercises((prev) => prev.filter((id) => id !== exercise.id))
                    }
                    className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${exercise.name}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </FullScreenSheet>
  );
}
