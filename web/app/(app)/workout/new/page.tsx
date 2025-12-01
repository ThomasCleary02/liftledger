"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkout,
  Exercise,
  StrengthSetEntry,
  CalisthenicsSetEntry,
  Workout,
} from "../../../../lib/firestore/workouts";
import ExerciseSearch from "../../../../components/ExerciseSearch";
import StrengthSetInput, { StrengthSet } from "../../../../components/StrengthSetInput";
import CardioInput, { CardioData } from "../../../../components/CardioInput";
import CalisthenicsSetInput, { CalisthenicsSet } from "../../../../components/CalisthenicsSetInput";
import {
  Calendar,
  Plus,
  Trash2,
  Dumbbell,
  Heart,
  Activity,
  ArrowLeft,
  Pencil,
  FileText,
  X,
  ChevronRight,
} from "lucide-react";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../../../lib/utils/units";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { listTemplates, type WorkoutTemplate } from "../../../../lib/firestore/workoutTemplates";
import { createTemplate } from "../../../../lib/firestore/workoutTemplates";
import { listWorkouts } from "../../../../lib/firestore/workouts";
import { getLastExerciseData } from "../../../../lib/analytics/calculations";

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

export default function NewWorkout() {
  const router = useRouter();
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [dateStr, setDateStr] = useState<string>(getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "5" });
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { preferences } = usePreferences();

  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const workouts = await listWorkouts({ limit: 500, order: "desc" });
        setAllWorkouts(workouts);
      } catch (error) {
        console.error("Failed to load workouts for exercise history", error);
      }
    };
    loadWorkouts();
  }, []);

  const handleExerciseSelect = async (
    id: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => {
    setSelectedExercise({ id, name, modality });

    // Get last exercise data
    const lastExercise = getLastExerciseData(allWorkouts, id);

    if (modality === "cardio") {
      if (lastExercise?.modality === "cardio" && lastExercise.cardioData) {
        setCardioData({
          duration: String(Math.round(lastExercise.cardioData.duration / 60)),
          distance: lastExercise.cardioData.distance ? String(lastExercise.cardioData.distance) : "5",
        });
      } else {
        setCardioData({ duration: "30", distance: "5" });
      }
    } else if (modality === "calisthenics") {
      if (lastExercise?.modality === "calisthenics" && lastExercise.calisthenicsSets && lastExercise.calisthenicsSets.length > 0) {
        setCalisthenicsSets(
          lastExercise.calisthenicsSets.map((s) => ({
            reps: String(s.reps),
            duration: s.duration ? String(s.duration) : "",
          }))
        );
      } else {
        setCalisthenicsSets([{ reps: "10" }]);
      }
    } else {
      // Strength
      if (lastExercise?.modality === "strength" && lastExercise.strengthSets && lastExercise.strengthSets.length > 0) {
        setStrengthSets(
          lastExercise.strengthSets.map((s) => ({
            reps: String(s.reps),
            weight: String(s.weight),
          }))
        );
      } else {
        setStrengthSets([{ reps: "10", weight: "135" }]);
      }
    }
  };

  const startEditingExercise = (idx: number) => {
    const ex = exercises[idx];
    setEditingIndex(idx);
    setSelectedExercise({
      id: ex.exerciseId ?? "",
      name: ex.name,
      modality: ex.modality,
    });

    if (ex.modality === "strength") {
      setStrengthSets(
        ex.strengthSets?.map((s) => ({
          reps: String(s.reps),
          weight: String(s.weight),
        })) ?? [{ reps: "10", weight: "135" }]
      );
    } else if (ex.modality === "cardio") {
      setCardioData({
        duration: ex.cardioData ? String(Math.round(ex.cardioData.duration / 60)) : "",
        distance: ex.cardioData?.distance != null ? String(ex.cardioData.distance) : "",
      });
    } else {
      setCalisthenicsSets(
        ex.calisthenicsSets?.map((s) => ({
          reps: String(s.reps),
          duration: s.duration != null ? String(s.duration) : "",
        })) ?? [{ reps: "10" }]
      );
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

    setExercises((prev) => {
      if (editingIndex !== null) {
        return prev.map((item, i) => (i === editingIndex ? exercise : item));
      }
      return [...prev, exercise];
    });
    setSelectedExercise(null);
    setEditingIndex(null);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
    setEditingIndex((prev) => (prev !== null && prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev));
    if (editingIndex === idx) {
      setSelectedExercise(null);
    }
  };

  const save = async () => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

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

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const loadTemplates = async () => {
    try {
      const templates = await listTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error("Failed to load templates", error);
      toast.error("Failed to load templates");
    }
  };

  const loadTemplate = (template: WorkoutTemplate) => {
    setExercises(template.exercises.map(ex => ({ ...ex }))); // Deep copy
    setShowTemplateSelector(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Add exercises to the workout first");
      return;
    }

    try {
      await createTemplate({
        name: templateName.trim(),
        exercises: exercises.map(ex => ({ ...ex })), // Deep copy
      });
      toast.success(`Template "${templateName}" created successfully`);
      setShowSaveTemplate(false);
      setTemplateName("");
      loadTemplates(); // Refresh templates list
    } catch (error) {
      console.error("Failed to create template", error);
      toast.error("Failed to create template");
    }
  };

  useEffect(() => {
    if (showTemplateSelector) {
      loadTemplates();
    }
  }, [showTemplateSelector]);

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

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Workout Templates</h2>
            <div className="flex gap-2">
              {exercises.length > 0 && (
                <button
                  onClick={() => setShowSaveTemplate(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 font-semibold text-blue-700 transition-colors hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4" />
                  Save as Template
                </button>
              )}
              <button
                onClick={() => {
                  setShowTemplateSelector(true);
                  loadTemplates();
                }}
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <FileText className="h-4 w-4" />
                Use Template
              </button>
            </div>
          </div>
          {/* Template selector modal */}
        </div>

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
                      <div
                        className={`inline-block self-start rounded-full px-2.5 py-1 ${getModalityColor(
                          ex.modality
                        )}`}
                      >
                        <span className="text-xs font-semibold capitalize">{ex.modality}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditingExercise(idx)}
                        className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeExercise(idx)}
                        className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Add Exercise</h2>

          {editingIndex !== null && (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Editing exercise #{editingIndex + 1}. Saving will replace the existing entry.
            </div>
          )}

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
                      <span className="text-xs font-semibold capitalize">
                        {selectedExercise.modality}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedExercise(null);
                    setEditingIndex(null);
                  }}
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
                {editingIndex !== null ? "Update Exercise" : "Add to Workout"}
              </button>
            </div>
          )}
        </div>

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

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 m-4 max-h-[80vh] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Select Template</h2>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No templates found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Create templates in Settings to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="w-full text-left rounded-xl border-2 border-gray-200 bg-gray-50 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 m-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Save as Template</h2>
              <button
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Leg Day, Chest Day"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveAsTemplate();
                  }
                }}
              />
            </div>

            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                This will save {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} as a template
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName("");
                }}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                className="flex-1 rounded-xl bg-black px-4 py-3 font-bold text-white transition-opacity hover:opacity-90"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
