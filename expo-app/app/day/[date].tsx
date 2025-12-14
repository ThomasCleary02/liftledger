import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO, isValid } from "date-fns";
import {
  getDayByDate,
  createDay,
  updateDay,
  Day,
  Exercise,
  listDays,
} from "../../lib/firestore/days";
import ExerciseSearch from "../../components/ExerciseSearch";
import DayNavigation from "../../components/DayNavigation";
import StrengthSetInput, { StrengthSet } from "../../components/StrengthSetInput";
import CalisthenicsSetInput, { CalisthenicsSet } from "../../components/CalisthenicsSetInput";
import CardioInput, { CardioData } from "../../components/CardioInput";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../lib/utils/units";
import { listTemplates, type WorkoutTemplate } from "../../lib/firestore/workoutTemplates";

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

export default function DayView() {
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const [day, setDay] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "5" });
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { preferences } = usePreferences();
  const [allDays, setAllDays] = useState<Day[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const loadTemplates = async () => {
    try {
      const templateList = await listTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error("Failed to load templates", error);
      Alert.alert("Error", "Failed to load templates");
    }
  };

  // Helper to clean exercise data (remove undefined values)
  const cleanExercise = (ex: Exercise): Exercise => {
    const cleaned: any = {
      exerciseId: ex.exerciseId,
      name: ex.name,
      modality: ex.modality,
    };
    
    // Clean strength sets
    if (ex.strengthSets && Array.isArray(ex.strengthSets)) {
      cleaned.strengthSets = ex.strengthSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps, weight: set.weight };
        return cleanSet;
      });
    }
    
    // Clean cardio data
    if (ex.cardioData) {
      const cleanCardio: any = { duration: ex.cardioData.duration };
      if (ex.cardioData.distance !== undefined && ex.cardioData.distance !== null) {
        cleanCardio.distance = ex.cardioData.distance;
      }
      if (ex.cardioData.pace !== undefined && ex.cardioData.pace !== null) {
        cleanCardio.pace = ex.cardioData.pace;
      }
      cleaned.cardioData = cleanCardio;
    }
    
    // Clean calisthenics sets
    if (ex.calisthenicsSets && Array.isArray(ex.calisthenicsSets)) {
      cleaned.calisthenicsSets = ex.calisthenicsSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps };
        if (set.duration !== undefined && set.duration !== null) {
          cleanSet.duration = set.duration;
        }
        return cleanSet;
      });
    }
    
    if (ex.notes !== undefined && ex.notes !== null) cleaned.notes = ex.notes;
    
    return cleaned as Exercise;
  };

  const loadTemplate = async (template: WorkoutTemplate) => {
    if (!template.exercises || template.exercises.length === 0) {
      Alert.alert("Error", "Template has no exercises");
      return;
    }

    setSaving(true);
    try {
      const currentDay = await ensureDayExists();
      const existingExercises = (currentDay.exercises || []).map(cleanExercise); // Clean existing too
      const templateExercises = template.exercises.map(cleanExercise); // Clean and copy
      const nextExercises = [...existingExercises, ...templateExercises];

      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises });
        setDay({ ...currentDay, exercises: nextExercises });
        Alert.alert("Success", `Loaded template: ${template.name}`);
      }
      setShowTemplateSelector(false);
    } catch (error) {
      console.error("Failed to load template", error);
      Alert.alert("Error", "Failed to load template");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (showTemplateSelector) {
      loadTemplates();
    }
  }, [showTemplateSelector]);

  const getCurrentDate = (): string => {
    if (dateParam === "today") {
      return format(new Date(), "yyyy-MM-dd");
    }
    const parsed = parseISO(dateParam || "");
    if (!isValid(parsed)) {
      return format(new Date(), "yyyy-MM-dd");
    }
    return format(parsed, "yyyy-MM-dd");
  };

  const currentDate = getCurrentDate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDayByDate(currentDate);
        if (mounted) setDay(d);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to load day");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const loadDays = async () => {
      try {
        const days = await listDays({ limit: 500, order: "desc" });
        setAllDays(days);
      } catch (error) {
        // Silently fail - exercise history is optional
        // This will work once Firestore rules are deployed
        console.warn("Failed to load days for exercise history (non-critical)", error);
      }
    };
    loadDays();

    return () => {
      mounted = false;
    };
  }, [currentDate]);

  const handleDateChange = (newDate: string) => {
    router.push(`/day/${newDate}`);
  };

  const handleTodayClick = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.push(`/day/${today}`);
  };

  const getLastExerciseData = (days: Day[], exerciseId: string): Exercise | null => {
    const sortedDays = [...days].sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    for (const day of sortedDays) {
      const exercise = day.exercises.find(
        (ex) => (ex.exerciseId || ex.name) === exerciseId
      );
      if (exercise) {
        return exercise;
      }
    }
    return null;
  };

  const handleExerciseSelect = (
    exerciseId: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => {
    setSelectedExercise({ id: exerciseId, name, modality });

    const lastExercise = getLastExerciseData(allDays, exerciseId);

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
    if (!day) return;
    const ex = day.exercises[idx];
    if (!ex) return;

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

  const ensureDayExists = async (): Promise<Day> => {
    if (day) return day;

    const newDay = await createDay({
      date: currentDate,
      isRestDay: false,
      exercises: [],
    });
    setDay(newDay);
    return newDay;
  };

  const addExercise = async () => {
    if (!selectedExercise) return;

    let exercise: Exercise;

    if (selectedExercise.modality === "cardio") {
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60;
      const distance = cardioData.distance ? Number(cardioData.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        Alert.alert("Invalid duration", "Duration must be a positive number of minutes.");
        return;
      }

      const cardioDataObj: any = { duration };
      if (distance && isFinite(distance) && distance > 0) {
        cardioDataObj.distance = distance;
        if (duration > 0) {
          cardioDataObj.pace = duration / distance;
        }
      }
      
      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "cardio",
        cardioData: cardioDataObj,
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
        Alert.alert("Invalid sets", "Add at least one valid set with reps.");
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
        Alert.alert("Invalid sets", "Add at least one valid set.");
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
      const currentDay = await ensureDayExists();
      const cleanedExercise = cleanExercise(exercise);
      const nextExercises =
        editingIndex !== null
          ? currentDay.exercises.map((item, i) => (i === editingIndex ? cleanedExercise : cleanExercise(item)))
          : [...(currentDay.exercises || []).map(cleanExercise), cleanedExercise];

      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises });
        setDay({ ...currentDay, exercises: nextExercises });
      }
      setSelectedExercise(null);
      setEditingIndex(null);
      setStrengthSets([{ reps: "10", weight: "135" }]);
      setCardioData({ duration: "30", distance: "5" });
      setCalisthenicsSets([{ reps: "10" }]);
      Alert.alert("Success", editingIndex !== null ? "Exercise updated" : "Exercise added successfully");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save exercise");
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = async (idx: number) => {
    if (!day) return;
    setSaving(true);
    try {
      const next = day.exercises.filter((_, i: number) => i !== idx).map(cleanExercise);
      await updateDay(day.id, { exercises: next });
      setDay({ ...day, exercises: next });
      if (editingIndex === idx) {
        setSelectedExercise(null);
        setEditingIndex(null);
      } else if (editingIndex !== null && editingIndex > idx) {
        setEditingIndex(editingIndex - 1);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to remove exercise");
    } finally {
      setSaving(false);
    }
  };

  const toggleRestDay = async () => {
    if (!day) {
      setSaving(true);
      try {
        const newDay = await createDay({
          date: currentDate,
          isRestDay: true,
          exercises: [],
        });
        setDay(newDay);
        Alert.alert("Success", "Marked as rest day");
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to mark rest day");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      await updateDay(day.id, { isRestDay: !day.isRestDay });
      setDay({ ...day, isRestDay: !day.isRestDay });
      Alert.alert("Success", day.isRestDay ? "Removed rest day" : "Marked as rest day");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to toggle rest day");
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading day...</Text>
      </View>
    );
  }

  const hasExercises = day && day.exercises.length > 0;
  const isRestDay = day?.isRestDay ?? false;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-1 bg-gray-50">
        {/* Custom Header */}
        <DayNavigation
          currentDate={currentDate}
          onDateChange={handleDateChange}
          onTodayClick={handleTodayClick}
        />

        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header with Rest Day Toggle and Template Button */}
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <Pressable
            onPress={toggleRestDay}
            disabled={saving}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg border px-4 py-2.5 ${
              isRestDay
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <Ionicons name="moon-outline" size={16} color={isRestDay ? "#2563eb" : "#4b5563"} />
            <Text className={`text-sm font-medium ${isRestDay ? "text-blue-700" : "text-gray-700"}`}>
              {isRestDay ? "Rest Day" : "Mark as Rest Day"}
            </Text>
          </Pressable>
          {!isRestDay && (
            <Pressable
              onPress={() => {
                setShowTemplateSelector(true);
                loadTemplates();
              }}
              className="flex-row items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
            >
              <Ionicons name="document-text-outline" size={16} color="#4b5563" />
              <Text className="text-sm text-gray-700">Template</Text>
            </Pressable>
          )}
        </View>

        {/* Add / Edit Exercise - Moved to Top */}
        {!isRestDay && (
          <View className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Add Exercise</Text>

            {editingIndex !== null && (
              <View className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Text className="text-sm text-blue-700">
                  Editing exercise #{editingIndex + 1}. Saving will replace the existing entry.
                </Text>
              </View>
            )}

            {!selectedExercise ? (
              <ExerciseSearch onSelect={handleExerciseSelect} />
            ) : (
              <View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <View>
                    <Text className="font-semibold text-gray-900">{selectedExercise.name}</Text>
                    <Text className="text-gray-500 text-xs capitalize mt-1">{selectedExercise.modality}</Text>
                  </View>
                  <Pressable onPress={() => {
                    setSelectedExercise(null);
                    setEditingIndex(null);
                  }}>
                    <Text className="text-sm text-gray-600">Change</Text>
                  </Pressable>
                </View>

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

                <Pressable
                  onPress={addExercise}
                  disabled={saving}
                  className={`mt-4 rounded-lg px-4 py-3 ${saving ? "bg-gray-300" : "bg-black"}`}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text className="text-white font-semibold text-center">
                      {saving ? "Saving..." : editingIndex !== null ? "Update Exercise" : "Add Exercise"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Exercises List */}
        {!isRestDay && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Exercises</Text>
            {hasExercises ? (
              <View className="space-y-3">
                {day!.exercises.map((ex: Exercise, idx: number) => (
                  <View key={`${ex.name}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">{ex.name}</Text>
                        <Text className="text-gray-500 text-xs capitalize mt-1">{ex.modality}</Text>
                      </View>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => startEditingExercise(idx)}
                          className="bg-gray-100 rounded-full p-2"
                        >
                          <Ionicons name="pencil" size={16} color="#4b5563" />
                        </Pressable>
                        <Pressable
                          onPress={() => removeExercise(idx)}
                          className="bg-red-50 rounded-full p-2"
                        >
                          <Ionicons name="trash" size={16} color="#dc2626" />
                        </Pressable>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {ex.modality === "strength" &&
                        ex.strengthSets?.map((st: any, i: number) => (
                          <View key={i} className="bg-gray-100 rounded px-3 py-1">
                            <Text className="text-sm text-gray-700">
                              {st.reps}×{formatWeight(st.weight, preferences.units)}
                            </Text>
                          </View>
                        ))}
                      {ex.modality === "cardio" && ex.cardioData && (
                        <View className="bg-gray-100 rounded px-3 py-1">
                          <Text className="text-sm text-gray-700">
                            {formatDuration(ex.cardioData.duration)}
                            {ex.cardioData.distance
                              ? ` • ${formatDistance(ex.cardioData.distance, preferences.units)}`
                              : null}
                          </Text>
                        </View>
                      )}
                      {ex.modality === "calisthenics" &&
                        ex.calisthenicsSets?.map((st: any, i: number) => (
                          <View key={i} className="bg-gray-100 rounded px-3 py-1">
                            <Text className="text-sm text-gray-700">
                              {st.reps} reps
                              {st.duration ? ` • ${formatDuration(st.duration)}` : null}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white border border-gray-200 rounded-lg p-8 items-center">
                <Text className="text-gray-500">No exercises logged for this day</Text>
              </View>
            )}
          </View>
        )}

        {isRestDay && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-8 items-center">
            <Ionicons name="moon" size={48} color="#2563eb" />
            <Text className="text-lg font-semibold text-blue-900 mt-4">Rest Day</Text>
            <Text className="text-sm text-blue-700 mt-2">No exercises logged for this rest day.</Text>
          </View>
        )}

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center p-4">
            <View className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl">
              <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
                <Text className="text-lg font-bold text-gray-900">Select Template</Text>
                <Pressable
                  onPress={() => setShowTemplateSelector(false)}
                  className="rounded-full p-1"
                >
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </Pressable>
              </View>
              <ScrollView className="max-h-96 px-6 py-4">
                {templates.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                    <Text className="text-gray-500 mt-3">No templates found</Text>
                    <Text className="text-sm text-gray-400 mt-1">Create templates in Settings</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {templates.map((template) => (
                      <Pressable
                        key={template.id}
                        onPress={() => loadTemplate(template)}
                        disabled={saving}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 mb-2"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-900">{template.name}</Text>
                            <Text className="mt-1 text-sm text-gray-500">
                              {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
