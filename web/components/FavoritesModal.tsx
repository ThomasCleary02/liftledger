"use client";

import { useEffect } from "react";
import { X, Star } from "lucide-react";
import type { ExerciseDoc } from "../lib/firestore/exercises";

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
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-h-[90vh] flex flex-col rounded-t-3xl bg-white md:max-w-lg md:rounded-2xl md:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Favorite Exercises</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-black"></div>
            </div>
          ) : favoriteExercises.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No favorite exercises yet</p>
              <p className="mt-1 text-xs text-gray-400">Star exercises in the workout editor to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 break-words">{exercise.name}</p>
                    {exercise.muscleGroup && (
                      <p className="text-sm text-gray-500 capitalize mt-0.5">
                        {exercise.muscleGroup.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveFavorite(exercise.id)}
                    className="ml-4 flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="Remove from favorites"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
