"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { FullScreenSheet } from "./FullScreenSheet";
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
  const [searchQuery, setSearchQuery] = useState("");
  const savingRef = useRef(false);
  const selectedRef = useRef(selectedExercises);
  selectedRef.current = selectedExercises;

  useEffect(() => {
    if (open) {
      setSelectedExercises(trackedExercises);
      setSearchQuery("");
      savingRef.current = false;
    }
  }, [open, trackedExercises]);

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

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <FullScreenSheet
      open={open}
      title="My Exercises"
      closeText="Done"
      onClose={() => {
        void persistAndClose();
      }}
    >
      <p className="mb-4 text-gray-600">Select exercises to track for PRs. Done saves your picks.</p>
      <input
        type="text"
        placeholder="Search exercises..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand focus:bg-white"
      />
      <div className="space-y-2">
        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading exercises...</p>
        ) : filteredExercises.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No exercises found.</p>
        ) : (
          filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => {
                setSelectedExercises((prev) =>
                  prev.includes(exercise.id)
                    ? prev.filter((id) => id !== exercise.id)
                    : [...prev, exercise.id]
                );
              }}
              className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-colors ${
                selectedExercises.includes(exercise.id)
                  ? "border-brand bg-brand/10"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selectedExercises.includes(exercise.id) ? "border-brand bg-brand/100" : "border-gray-300"
                  }`}
                >
                  {selectedExercises.includes(exercise.id) && <Check className="h-4 w-4 text-brand-fg" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{exercise.name}</p>
                  <p className="text-xs capitalize text-gray-500">{exercise.modality}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </FullScreenSheet>
  );
}
