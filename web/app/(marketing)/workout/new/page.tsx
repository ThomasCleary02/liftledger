"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkout, Exercise, StrengthSetEntry, CalisthenicsSetEntry } from "../../../../lib/firestore/workouts";
import ExerciseSearch from "../../../../components/ExerciseSearch";
import StrengthSetInput, { StrengthSet } from "../../../../components/StrengthSetInput";
import CardioInput, { CardioData } from "../../../../components/CardioInput";
import CalisthenicsSetInput, { CalisthenicsSet } from "../../../../components/CalisthenicsSetInput";
import { Calendar, Plus, Trash2, Dumbbell, Heart, Activity, ArrowLeft } from "lucide-react";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../../../lib/utils/units";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

export default function NewWorkout() {
  const router = useRouter();
  // Fix: Format date as local YYYY-MM-DD instead of UTC
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [dateStr, setDateStr] = useState<string>(getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);

  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "5" });
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { preferences } = usePreferences();

  const handleExerciseSelect = (id: string, name: string, modality: "strength" | "cardio" | "calisthenics") => {
    setSelectedExercise({ id, name, modality });

    if (modality === "cardio") {
      setCardioData({ duration: "30", distance: "5" });
    } else if (modality === "calisthenics") {
      setCalisthenicsSets([{ reps: "10" }]);
    } else {
      setStrengthSets([{ reps: "10", weight: "135" }]);
    }
  };

  const addExercise = () => {
    if (!selectedExercise) return;

    let exercise: Exercise;

    if (selectedExercise.modality === "cardio") {
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60;
      const distance = cardioData.distance ? Number(cardioData.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        toast.error("Duration must be a positive number of minutes.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "cardio",
        cardioData: {
          duration,
          distance: distance && isFinite(distance) && distance > 0 ? distance : undefined,
          pace: distance && distance > 0 && duration > 0 ? duration / distance : undefined,
        },
      };
    } else if (selectedExercise.modality === "calisthenics") {
      const sets = calisthenicsSets
        .map((s) => {
          const reps = Number(s.reps);
          const duration = s.duration ? Number(s.duration) : undefined;
          if (!isFinite(reps) || reps <= 0) return null;
          // Only include duration if it's a valid number
          const setObj: { reps: number; duration?: number } = { reps };
          if (duration && isFinite(duration) && duration > 0) {
            setObj.duration = duration;
          }
          return setObj;
        })
        .filter((s): s is { reps: number; duration?: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set with reps.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "calisthenics",
        calisthenicsSets: sets,
      };
    } else {
      const sets = strengthSets
        .map((s) => {
          const reps = Number(s.reps);
          const weight = Number(s.weight);
          if (!isFinite(reps) || reps <= 0 || !isFinite(weight) || weight < 0) return null;
          return { reps, weight };
        })
        .filter((s): s is { reps: number; weight: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "strength",
        strengthSets: sets,
      };
    }

    setExercises((prev) => [...prev, exercise]);
    setSelectedExercise(null);
  };

  const removeExercise = (idx: number) => setExercises((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    // Fix: Parse date string as local date (not UTC)
    // When you select "2025-11-05", we want it to be Nov 5 in local time, not UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    date.setHours(0, 0, 0, 0); // Set to midnight local time
    
    if (isNaN(date.getTime())) {
      toast.error("Invalid date. Use YYYY-MM-DD format.");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Add at least one exercise.");
      return;
    }

    setLoading(true);
    try {
      await createWorkout({ date, exercises });
      toast.success("Workout created successfully");
      router.push("/workouts");
    } catch (error: unknown) {
      logger.error("Failed to create workout", error);
      const message = error instanceof Error ? error.message : "Failed to create workout";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const getModalityColor = (mod: string) => {
    if (mod === "strength") return "bg-blue-100 text-blue-700";
    if (mod === "cardio") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  const getModalityIcon = (mod: string) => {
    if (mod === "strength") return Dumbbell;
    if (mod === "cardio") return Heart;
    return Activity;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/workouts")}
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">New Workout</h1>
            <p className="text-gray-500">Track your training session</p>
          </div>
        </div>

        {/* Date Input */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center">
            <div className="mr-3 rounded-full bg-gray-100 p-2">
              <Calendar className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="mb-1 font-semibold text-gray-900">Date</p>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Exercises List */}
        {exercises.length > 0 && (
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Exercises</h2>
              <div className="rounded-full bg-gray-100 px-3 py-1">
                <span className="font-semibold text-gray-700">{exercises.length}</span>
              </div>
            </div>
            {exercises.map((ex, idx) => {
              const Icon = getModalityIcon(ex.modality);
              return (
                <div
                  key={`${ex.name}-${idx}`}
                  className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-bold text-gray-900">{ex.name}</h3>
                      <div className={`inline-block self-start rounded-full px-2.5 py-1 ${getModalityColor(ex.modality)}`}>
                        <span className="text-xs font-semibold capitalize">{ex.modality}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExercise(idx)}
                      className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ex.modality === "strength" &&
                      ex.strengthSets?.map((st: StrengthSetEntry, i: number) => (
                        <div key={i} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                          <p className="font-semibold text-blue-900">
                            {st.reps} × {formatWeight(st.weight, preferences.units)}
                          </p>
                        </div>
                      ))}
                    {ex.modality === "cardio" && ex.cardioData && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                        <p className="font-semibold text-red-900">
                          {formatDuration(ex.cardioData.duration)}
                          {ex.cardioData.distance
                            ? ` • ${formatDistance(ex.cardioData.distance, preferences.units)}`
                            : null}
                        </p>
                      </div>
                    )}
                    {ex.modality === "calisthenics" &&
                      ex.calisthenicsSets?.map((st: CalisthenicsSetEntry, i: number) => (
                        <div key={i} className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                          <p className="font-semibold text-green-900">
                            {st.reps} reps
                            {st.duration ? ` (${formatDuration(st.duration)} hold)` : null}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Exercise */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Add Exercise</h2>

          {!selectedExercise ? (
            <ExerciseSearch onSelect={handleExerciseSelect} />
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedExercise.name}</h3>
                  <div className="mt-2 flex items-center">
                    <div
                      className={`rounded-full px-2.5 py-1 ${
                        selectedExercise.modality === "strength"
                          ? "bg-blue-100"
                          : selectedExercise.modality === "cardio"
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      <span className="text-xs font-semibold capitalize">{selectedExercise.modality}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="rounded-full bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Change
                </button>
              </div>

              {selectedExercise.modality === "strength" && (
                <StrengthSetInput sets={strengthSets} onSetsChange={setStrengthSets} />
              )}

              {selectedExercise.modality === "cardio" && (
                <CardioInput data={cardioData} onDataChange={setCardioData} />
              )}

              {selectedExercise.modality === "calisthenics" && (
                <CalisthenicsSetInput
                  sets={calisthenicsSets}
                  onSetsChange={setCalisthenicsSets}
                  showDuration={false}
                />
              )}

              <button
                onClick={addExercise}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
                Add to Workout
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={save}
          disabled={loading || exercises.length === 0}
          className={`w-full rounded-xl px-6 py-4 font-bold shadow-lg transition-opacity ${
            loading || exercises.length === 0
              ? "cursor-not-allowed bg-gray-300 text-gray-600"
              : "bg-black text-white hover:opacity-90"
          }`}
        >
          {loading ? "Saving..." : "Save Workout"}
        </button>
      </div>
    </div>
  );
}
