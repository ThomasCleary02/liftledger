"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../providers/Auth";
import { getWorkout, updateWorkout, deleteWorkout, Workout, Exercise, StrengthSetEntry, CalisthenicsSetEntry } from "../../../lib/firestore/workouts";
import ExerciseSearch from "../../../components/ExerciseSearch";
import StrengthSetInput from "../../../components/StrengthSetInput";
import CalisthenicsSetInput from "../../../components/CalisthenicsSetInput";
import { Trash2, Dumbbell, Heart, Activity, ArrowLeft } from "lucide-react";
import { usePreferences } from "../../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../../lib/utils/units";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { Timestamp } from "firebase/firestore";
import { ConfirmDialog } from "../../../components/ConfirmDialog";

type DraftSet = {
  mode: "reps" | "time";
  reps?: string;
  weight?: string;
  seconds?: string;
  distance?: string;
  note?: string;
  kind?: "normal" | "warmup" | "amrap" | "drop" | "rest-pause";
};

export default function WorkoutDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string; modality: "strength" | "cardio" | "calisthenics" } | null>(null);
  const [draftSets, setDraftSets] = useState<DraftSet[]>([
    { mode: "reps", reps: "10", weight: "0", kind: "normal" }
  ]);

  const { preferences } = usePreferences();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }
    
    let mounted = true;
    (async () => {
      try {
        const w = await getWorkout(id);
        if (mounted) setWorkout(w);
      } catch (error) {
        logger.error("Failed to load workout", error);
        if (mounted) {
          toast.error("Failed to load workout. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, user, router, authLoading]);

  const handleExerciseSelect = (exerciseId: string, name: string, modality: "strength" | "cardio" | "calisthenics") => {
    setSelectedExercise({ id: exerciseId, name, modality });
    
    if (modality === "cardio") {
      setDraftSets([{ mode: "time", seconds: "30", distance: "5", kind: "normal" }]);
    } else if (modality === "calisthenics") {
      setDraftSets([{ mode: "reps", reps: "10", weight: "0", kind: "normal" }]);
    } else {
      setDraftSets([{ mode: "reps", reps: "10", weight: "135", kind: "normal" }]);
    }
  };

  const addDraftSet = (mode: "reps" | "time") => {
    setDraftSets(p => [...p, mode === "reps"
      ? { mode, reps: "10", weight: "0", kind: "normal" }
      : { mode, seconds: "300", distance: "0", kind: "normal" }
    ]);
  };

  const removeDraftSet = (idx: number) => setDraftSets(p => p.filter((_, i) => i !== idx));

  const copyLastSet = () => {
    if (draftSets.length === 0) return;
    const last = draftSets[draftSets.length - 1];
    setDraftSets(p => [...p, { ...last }]);
  };

  const addExercise = async () => {
    if (!workout || !selectedExercise) return;

    let exercise: Exercise;

    if (selectedExercise.modality === "cardio") {
      const cardioSet = draftSets[0];
      if (!cardioSet || cardioSet.mode !== "time") {
        toast.error("Cardio exercises require time/distance mode.");
        return;
      }

      const durationMinutes = Number(cardioSet.seconds);
      const duration = durationMinutes * 60;
      const distance = cardioSet.distance ? Number(cardioSet.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        toast.error("Duration must be a positive number of minutes.");
        return;
      }

      if (distance !== undefined && (!isFinite(distance) || distance <= 0)) {
        toast.error("Distance must be a positive number.");
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
        }
      };
    } else if (selectedExercise.modality === "calisthenics") {
      const sets = draftSets
        .filter(s => s.mode === "reps")
        .map(s => {
          const reps = Number(s.reps);
          const duration = s.seconds ? Number(s.seconds) : undefined;
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
      const sets = draftSets
        .filter(s => s.mode === "reps")
        .map(s => {
          const reps = Number(s.reps);
          const weight = Number(s.weight);
          if (!isFinite(reps) || reps <= 0 || !isFinite(weight) || weight < 0) return null;
          return {
            reps,
            weight,
          };
        })
        .filter((s): s is { reps: number; weight: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set with reps and weight.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "strength",
        strengthSets: sets,
      };
    }

    setSaving(true);
    try {
      const next = [...(workout.exercises || []), exercise];
      await updateWorkout(workout.id, { exercises: next });
      setWorkout({ ...workout, exercises: next });
      setSelectedExercise(null);
      setDraftSets([{ mode: "reps", reps: "10", weight: "0", kind: "normal" }]);
      toast.success("Exercise added successfully");
    } catch (error) {
      logger.error("Failed to add exercise", error);
      const message = error instanceof Error ? error.message : "Failed to add exercise";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = async (idx: number) => {
    if (!workout) return;
    setSaving(true);
    try {
      const next = workout.exercises.filter((_, i: number) => i !== idx);
      await updateWorkout(workout.id, { exercises: next });
      setWorkout({ ...workout, exercises: next });
      toast.success("Exercise removed");
    } catch (error) {
      logger.error("Failed to remove exercise", error);
      const message = error instanceof Error ? error.message : "Failed to remove exercise";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteWorkout(id);
      toast.success("Workout deleted");
      router.push("/workouts");
    } catch (error) {
      logger.error("Failed to delete workout", error);
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast.error(message);
    }
  };

  // Helper function to safely convert workout date to Date
  const getWorkoutDate = (date: Date | Timestamp | string | any): Date => {
    if (date && typeof date.toDate === 'function') {
      // It's a Firestore Timestamp
      return date.toDate();
    }
    if (date instanceof Date) {
      return date;
    }
    // Fallback to parsing as string or creating new Date
    return new Date(date);
  };

  const date = workout ? getWorkoutDate(workout.date) : null;
  
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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-gray-500">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Workout not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-8 md:py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push("/workouts")}
              className="flex touch-target flex-shrink-0 items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Back to workouts"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="mb-0.5 text-lg font-bold text-gray-900 md:text-xl">{date ? date.toDateString() : "Unknown Date"}</h1>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 md:gap-3 md:text-sm">
                {workout.totalVolume && workout.totalVolume > 0 && (
                  <span>Volume: {formatWeight(workout.totalVolume, preferences.units)}</span>
                )}
                {workout.totalCardioDuration && workout.totalCardioDuration > 0 && (
                  <span>Cardio: {formatDuration(workout.totalCardioDuration)}</span>
                )}
                {workout.totalReps && workout.totalReps > 0 && (
                  <span>Reps: {workout.totalReps}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={confirmDeleteWorkout}
            className="flex touch-target flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 md:p-2.5"
            aria-label="Delete workout"
          >
            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-6 md:px-8">
        {/* Exercises List */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Exercises</h2>
          {(workout.exercises || []).length ? (
            <div className="space-y-3">
              {(workout.exercises || []).map((ex: Exercise, idx: number) => {
                const Icon = getModalityIcon(ex.modality);
                return (
                  <div key={`${ex.name}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{ex.name}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getModalityColor(ex.modality)}`}>
                          {ex.modality}
                        </span>
                      </div>
                      <button
                        onClick={() => removeExercise(idx)}
                        className="text-sm text-red-600 transition-colors hover:text-red-700"
                        aria-label={`Remove ${ex.name}`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ex.modality === "strength" && ex.strengthSets?.map((st: StrengthSetEntry, i: number) => (
                        <div key={i} className="rounded bg-gray-100 px-3 py-1">
                          <span className="text-sm text-gray-700">
                            {st.reps}×{formatWeight(st.weight, preferences.units)}
                          </span>
                        </div>
                      ))}
                      {ex.modality === "cardio" && ex.cardioData && (
                        <div className="rounded bg-gray-100 px-3 py-1">
                          <span className="text-sm text-gray-700">
                            {formatDuration(ex.cardioData.duration)}
                            {ex.cardioData.distance ? ` • ${formatDistance(ex.cardioData.distance, preferences.units)}` : null}
                            {ex.cardioData.pace ? ` • ${ex.cardioData.pace.toFixed(1)}s/${preferences.units === "metric" ? "km" : "mi"} pace` : null}
                          </span>
                        </div>
                      )}
                      {ex.modality === "calisthenics" && ex.calisthenicsSets?.map((st: CalisthenicsSetEntry, i: number) => (
                        <div key={i} className="rounded bg-gray-100 px-3 py-1">
                          <span className="text-sm text-gray-700">
                            {st.reps} reps
                            {st.duration ? ` • ${formatDuration(st.duration)}` : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">No exercises</p>
          )}
        </div>

        {/* Add Exercise */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Add Exercise</h2>
          
          {!selectedExercise ? (
            <ExerciseSearch onSelect={handleExerciseSelect} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedExercise.name}</h3>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getModalityColor(selectedExercise.modality)}`}>
                    {selectedExercise.modality}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-sm text-gray-600 transition-colors hover:text-gray-700"
                  aria-label="Change exercise"
                >
                  Change
                </button>
              </div>

              {selectedExercise.modality === "cardio" ? (
                <div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                      value={draftSets[0]?.seconds || ""}
                      onChange={(e) => setDraftSets([{ ...draftSets[0], seconds: e.target.value, mode: "time", kind: "normal" }])}
                      placeholder="30"
                      aria-label="Duration in minutes"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Distance (optional)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
                      value={draftSets[0]?.distance || ""}
                      onChange={(e) => setDraftSets([{ ...draftSets[0], distance: e.target.value, mode: "time", kind: "normal" }])}
                      placeholder="5"
                      aria-label="Distance"
                    />
                  </div>
                </div>
              ) : selectedExercise.modality === "strength" ? (
                <StrengthSetInput
                  sets={draftSets.map(s => ({ reps: s.reps || "10", weight: s.weight || "0" }))}
                  onSetsChange={(sets) => setDraftSets(sets.map(s => ({ mode: "reps" as const, reps: s.reps, weight: s.weight, kind: "normal" as const })))}
                />
              ) : (
                <CalisthenicsSetInput
                  sets={draftSets.map(s => ({ reps: s.reps || "10", duration: s.seconds }))}
                  onSetsChange={(sets) => setDraftSets(sets.map(s => ({ mode: "reps" as const, reps: s.reps, seconds: s.duration, kind: "normal" as const })))}
                  showDuration={false}
                />
              )}

              <button
                onClick={addExercise}
                disabled={saving}
                className={`mt-4 w-full rounded-lg px-4 py-3 font-semibold transition-opacity ${
                  saving ? "cursor-not-allowed bg-gray-300 text-gray-600" : "bg-black text-white hover:opacity-90"
                }`}
                aria-label="Add exercise to workout"
              >
                {saving ? "Adding..." : "Add Exercise"}
              </button>
            </div>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
