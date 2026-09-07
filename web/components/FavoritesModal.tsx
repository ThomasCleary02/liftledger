"use client";

import { Star, X } from "lucide-react";
import type { ExerciseDoc } from "../lib/firestore/exercises";
import { FullScreenSheet } from "./FullScreenSheet";

interface FavoritesModalProps {
  open: boolean;
  favoriteExercises: ExerciseDoc[];
  loading: boolean;
  onClose: () => void;
  onRemoveFavorite: (exerciseId: string) => void;
}

export function FavoritesModal({
  open,
  favoriteExercises,
  loading,
  onClose,
  onRemoveFavorite,
}: FavoritesModalProps) {
  return (
    <FullScreenSheet open={open} title="Favorite exercises" onClose={onClose} closeAriaLabel="Close favorites">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner-sm"></div>
        </div>
      ) : favoriteExercises.length === 0 ? (
        <div className="py-12 text-center">
          <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No favorite exercises yet</p>
          <p className="mt-1 text-xs text-gray-400">Star an exercise when you add it to a day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favoriteExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-gray-900">{exercise.name}</p>
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
    </FullScreenSheet>
  );
}
