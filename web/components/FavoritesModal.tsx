"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { searchExerciseCatalog } from "@liftledger/shared/firestore/exercises";
import type { ExerciseDoc } from "../lib/firestore/exercises";
import { FullScreenSheet } from "./FullScreenSheet";
import { ExerciseNameLabel } from "./ExerciseNameLabel";

interface FavoritesModalProps {
  open: boolean;
  favoriteExercises: ExerciseDoc[];
  allExercises: ExerciseDoc[];
  loading: boolean;
  onClose: () => void;
  onRemoveFavorite: (exerciseId: string) => void;
  onAddFavorite: (exerciseId: string) => void;
}

export function FavoritesModal({
  open,
  favoriteExercises,
  allExercises,
  loading,
  onClose,
  onRemoveFavorite,
  onAddFavorite,
}: FavoritesModalProps) {
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setAdding(false);
      setSearchQuery("");
    }
  }, [open]);

  const addCandidates = useMemo(() => {
    const favorited = new Set(favoriteExercises.map((ex) => ex.id));
    const remaining = allExercises.filter((ex) => !favorited.has(ex.id));
    return searchExerciseCatalog(remaining, searchQuery, undefined, 80);
  }, [allExercises, favoriteExercises, searchQuery]);

  const handleClose = () => {
    if (adding) {
      setAdding(false);
      setSearchQuery("");
      return;
    }
    onClose();
  };

  return (
    <FullScreenSheet
      open={open}
      title={adding ? "Add favorite" : "Favorite exercises"}
      closeText={adding ? "Back" : "Done"}
      onClose={handleClose}
      closeAriaLabel={adding ? "Back" : "Close favorites"}
    >
      {adding ? (
        <>
          <p className="mb-4 text-gray-600">Star exercises you use often.</p>
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
              <div className="flex items-center justify-center py-12">
                <div className="spinner-sm"></div>
              </div>
            ) : addCandidates.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No exercises found.</p>
            ) : (
              addCandidates.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onAddFavorite(exercise.id);
                    setAdding(false);
                    setSearchQuery("");
                  }}
                  className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      <ExerciseNameLabel name={exercise.name} />
                    </p>
                    {exercise.muscleGroup ? (
                      <p className="text-xs capitalize text-gray-500">
                        {exercise.muscleGroup.replace(/_/g, " ")}
                      </p>
                    ) : (
                      <p className="text-xs capitalize text-gray-500">{exercise.modality}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner-sm"></div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mb-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 hover:border-brand hover:bg-brand/5"
          >
            <Plus className="h-5 w-5" />
            Add favorite
          </button>
          {favoriteExercises.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No favorite exercises yet</p>
              <p className="mt-1 text-xs text-gray-400">Add from here or star one when you log a day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-gray-900">
                      <ExerciseNameLabel name={exercise.name} />
                    </p>
                    {exercise.muscleGroup && (
                      <p className="mt-0.5 text-sm capitalize text-gray-500">
                        {exercise.muscleGroup.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(exercise.id)}
                    className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove from favorites"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </FullScreenSheet>
  );
}
