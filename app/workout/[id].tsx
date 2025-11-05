// app/workout/[id].tsx
import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, ActivityIndicator, Pressable, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { getWorkout, updateWorkout, deleteWorkout, Workout, Exercise } from "../../lib/firestore/workouts";
import ExerciseSearch from "../../components/ExerciseSearch";

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string; modality: "strength" | "cardio" | "calisthenics" } | null>(null);
  const [draftSets, setDraftSets] = useState<DraftSet[]>([
    { mode: "reps", reps: "10", weight: "0", kind: "normal" }
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const w = await getWorkout(id);
        if (mounted) setWorkout(w);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleExerciseSelect = (exerciseId: string, name: string, modality: "strength" | "cardio" | "calisthenics") => {
    setSelectedExercise({ id: exerciseId, name, modality });
    
    if (modality === "cardio") {
      setDraftSets([{ mode: "time", seconds: "30", distance: "5", kind: "normal" }]); // Change to minutes
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
        Alert.alert("Invalid cardio data", "Cardio exercises require time/distance mode.");
        return;
      }

      const durationMinutes = Number(cardioSet.seconds); // Now represents minutes
      const duration = durationMinutes * 60; // Convert to seconds for storage
      const distance = cardioSet.distance ? Number(cardioSet.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        Alert.alert("Invalid duration", "Duration must be a positive number of minutes.");
        return;
      }

      if (distance !== undefined && (!isFinite(distance) || distance <= 0)) {
        Alert.alert("Invalid distance", "Distance must be a positive number.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "cardio",
        cardioData: {
          duration, // Store as seconds
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
          return {
            reps,
            duration: duration && isFinite(duration) && duration > 0 ? duration : undefined,
          };
        })
        .filter((s): s is { reps: number; duration: number | undefined } => s !== null) as { reps: number; duration: number | undefined }[];

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
        Alert.alert("Invalid sets", "Add at least one valid set with reps and weight.");
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
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to add exercise");
    } finally {
      setSaving(false);
    }
  };

  const removeExercise = async (idx: number) => {
    if (!workout) return;
    setSaving(true);
    try {
      const next = (workout.exercises || []).filter((_, i) => i !== idx);
      await updateWorkout(workout.id, { exercises: next });
      setWorkout({ ...workout, exercises: next });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to remove exercise");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteWorkout = () => {
    Alert.alert("Delete workout", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWorkout(id);
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/workouts");
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to delete");
          }
        }
      }
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={confirmDeleteWorkout} className="px-3 py-2">
          <Text className="text-red-600">Delete</Text>
        </Pressable>
      )
    });
  }, [navigation]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Workout not found</Text>
      </View>
    );
  }

  const date = (workout.date as any)?.toDate ? (workout.date as any).toDate() : new Date(workout.date as any);
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-1">{date.toDateString()}</Text>
          <View className="flex-row flex-wrap gap-3 mt-2">
            {workout.totalVolume && (
              <Text className="text-gray-600">Volume: {workout.totalVolume.toLocaleString()}</Text>
            )}
            {workout.totalCardioDuration && (
              <Text className="text-gray-600">Cardio: {formatDuration(workout.totalCardioDuration)}</Text>
            )}
            {workout.totalReps && (
              <Text className="text-gray-600">Reps: {workout.totalReps}</Text>
            )}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">Exercises</Text>
          {(workout.exercises || []).length ? (
            (workout.exercises || []).map((ex, idx) => (
              <View key={`${ex.name}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-semibold">{ex.name}</Text>
                    <Text className="text-gray-500 text-xs capitalize">{ex.modality}</Text>
                  </View>
                  <Pressable onPress={() => removeExercise(idx)}>
                    <Text className="text-red-600 text-sm">Remove</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {ex.modality === "strength" && ex.strengthSets?.map((st, i) => (
                    <View key={i} className="bg-gray-100 rounded px-3 py-1">
                      <Text className="text-gray-700 text-sm">
                        {st.reps}×{st.weight}lb
                      </Text>
                    </View>
                  ))}
                  {ex.modality === "cardio" && ex.cardioData && (
                    <View className="bg-gray-100 rounded px-3 py-1">
                      <Text className="text-gray-700 text-sm">
                        {formatDuration(ex.cardioData.duration)}
                        {ex.cardioData.distance ? ` • ${ex.cardioData.distance}mi` : null}
                        {ex.cardioData.pace ? ` • ${ex.cardioData.pace.toFixed(1)}s/mi pace` : null}
                      </Text>
                    </View>
                  )}
                  {ex.modality === "calisthenics" && ex.calisthenicsSets?.map((st, i) => (
                    <View key={i} className="bg-gray-100 rounded px-3 py-1">
                      <Text className="text-gray-700 text-sm">
                        {st.reps} reps
                        {st.duration ? ` • ${formatDuration(st.duration)}` : null}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 text-center py-4">No exercises</Text>
          )}
        </View>

        <View>
          <Text className="text-lg font-semibold mb-3">Add Exercise</Text>
          
          {!selectedExercise ? (
            <ExerciseSearch onSelect={handleExerciseSelect} />
          ) : (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="font-semibold">{selectedExercise.name}</Text>
                  <Text className="text-gray-500 text-xs capitalize">{selectedExercise.modality}</Text>
                </View>
                <Pressable onPress={() => setSelectedExercise(null)}>
                  <Text className="text-gray-600 text-sm">Change</Text>
                </Pressable>
              </View>

              {selectedExercise.modality !== "cardio" && (
                <View className="flex-row mb-3">
                  <Text className="font-medium text-gray-700 mr-3">Mode:</Text>
                  <Pressable
                    onPress={() => setDraftSets(p => p.map(s => ({ ...s, mode: "reps" })))}
                    className={`px-3 py-1 rounded mr-2 ${draftSets[0]?.mode === "reps" ? "bg-black" : "bg-gray-200"}`}
                  >
                    <Text className={draftSets[0]?.mode === "reps" ? "text-white" : "text-gray-800"}>Reps × Weight</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDraftSets(p => p.map(s => ({ ...s, mode: "time" })))}
                    className={`px-3 py-1 rounded ${draftSets[0]?.mode === "time" ? "bg-black" : "bg-gray-200"}`}
                  >
                    <Text className={draftSets[0]?.mode === "time" ? "text-white" : "text-gray-800"}>Time/Distance</Text>
                  </Pressable>
                </View>
              )}

              {draftSets.map((s, idx) => (
                <View key={idx} className={`mb-3 pb-3 ${idx < draftSets.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  {selectedExercise.modality === "cardio" ? (
                    <View>
                      <View className="flex-row items-center mb-2">
                        <Text className="text-gray-700 mr-2 w-20">Duration:</Text>
                        <TextInput
                          className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
                          keyboardType="numeric"
                          value={s.seconds ?? ""}
                          onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, seconds: v } : it))}
                          placeholder="Seconds (e.g. 1800)"
                        />
                      </View>
                      <View className="flex-row items-center mb-2">
                        <Text className="text-gray-700 mr-2 w-20">Distance:</Text>
                        <TextInput
                          className="flex-1 bg-gray-100 rounded-lg px-3 py-2"
                          keyboardType="numeric"
                          value={s.distance ?? ""}
                          onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, distance: v } : it))}
                          placeholder="Miles (optional)"
                        />
                      </View>
                    </View>
                  ) : s.mode === "reps" ? (
                    <View className="flex-row items-center mb-2">
                      <TextInput
                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
                        keyboardType="numeric"
                        value={s.reps ?? ""}
                        onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, reps: v } : it))}
                        placeholder="Reps"
                      />
                      <Text className="mx-1 text-gray-600">×</Text>
                      <TextInput
                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2"
                        keyboardType="numeric"
                        value={s.weight ?? ""}
                        onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, weight: v } : it))}
                        placeholder={selectedExercise.modality === "calisthenics" ? "0 (bodyweight)" : "45"}
                      />
                      {selectedExercise.modality === "calisthenics" && (
                        <View className="ml-2">
                          <TextInput
                            className="bg-gray-100 rounded-lg px-3 py-2 w-24"
                            keyboardType="numeric"
                            value={s.seconds ?? ""}
                            onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, seconds: v } : it))}
                            placeholder="Hold (s)"
                          />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="flex-row items-center mb-2">
                      <TextInput
                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
                        keyboardType="numeric"
                        value={s.seconds ?? ""}
                        onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, seconds: v } : it))}
                        placeholder="Seconds"
                      />
                      <Text className="mx-1 text-gray-600">/</Text>
                      <TextInput
                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2"
                        keyboardType="numeric"
                        value={s.distance ?? ""}
                        onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, distance: v } : it))}
                        placeholder="Distance"
                      />
                    </View>
                  )}

                  <View className="flex-row items-center mb-2 flex-wrap">
                    {["normal", "warmup", "amrap", "drop", "rest-pause"].map(k => (
                      <Pressable
                        key={k}
                        onPress={() => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, kind: k as any } : it))}
                        className={`px-2 py-1 mr-2 mb-1 rounded ${s.kind === k ? "bg-black" : "bg-gray-200"}`}
                      >
                        <Text className={`${s.kind === k ? "text-white" : "text-gray-800"} text-xs`}>{k}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    className="bg-gray-100 rounded-lg px-3 py-2"
                    placeholder="Set note (optional)"
                    value={s.note ?? ""}
                    onChangeText={(v) => setDraftSets(prev => prev.map((it, i) => i === idx ? { ...it, note: v } : it))}
                  />

                  <Pressable onPress={() => removeDraftSet(idx)} className="self-start mt-2">
                    <Text className="text-red-600 text-sm">Remove set</Text>
                  </Pressable>
                </View>
              ))}

              {selectedExercise.modality !== "cardio" && (
                <View className="flex-row gap-2 mb-4">
                  <Pressable onPress={() => addDraftSet("reps")} className="bg-gray-200 rounded-lg px-3 py-2">
                    <Text className="text-gray-800 text-sm">+ Reps × Weight</Text>
                  </Pressable>
                  <Pressable onPress={() => addDraftSet("time")} className="bg-gray-200 rounded-lg px-3 py-2">
                    <Text className="text-gray-800 text-sm">+ Time/Distance</Text>
                  </Pressable>
                  {draftSets.length > 0 && (
                    <Pressable onPress={copyLastSet} className="bg-blue-100 rounded-lg px-3 py-2">
                      <Text className="text-blue-800 text-sm">Copy Last</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <Pressable onPress={addExercise} disabled={saving} className={`rounded-lg px-4 py-3 ${saving ? "bg-gray-300" : "bg-black"}`}>
                <Text className={`text-center font-semibold ${saving ? "text-gray-600" : "text-white"}`}>
                  {saving ? "Adding..." : "Add Exercise"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}