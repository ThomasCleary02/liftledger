// app/workout/new.tsx (Simplified)
import React, { useState } from "react";
import { View, Text, ActivityIndicator, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { createWorkout, Exercise } from "../../lib/firestore/workouts";
import ExerciseSearch from "../../components/ExerciseSearch";
import StrengthSetInput, { StrengthSet } from "../../components/StrengthSetInput";
import CardioInput, { CardioData } from "../../components/CardioInput";
import CalisthenicsSetInput, { CalisthenicsSet } from "../../components/CalisthenicsSetInput";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../lib/utils/units";

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

export default function NewWorkout() {
  const router = useRouter();
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  
  // Modality-specific states - Updated default from "1800" seconds to "30" minutes
  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "5" }); // Changed to minutes
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { units } = usePreferences();

  const handleExerciseSelect = (id: string, name: string, modality: "strength" | "cardio" | "calisthenics") => {
    setSelectedExercise({ id, name, modality });
    
    // Reset to defaults for each modality
    if (modality === "cardio") {
      setCardioData({ duration: "30", distance: "5" }); // Changed to minutes
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
      // Convert minutes to seconds for storage
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60; // Convert to seconds
      const distance = cardioData.distance ? Number(cardioData.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        Alert.alert("Invalid duration", "Duration must be a positive number of minutes.");
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
      const sets = calisthenicsSets
        .map(s => {
          const reps = Number(s.reps);
          const duration = s.duration ? Number(s.duration) : undefined;
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
      const sets = strengthSets
        .map(s => {
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

    setExercises(prev => [...prev, exercise]);
    setSelectedExercise(null);
  };

  const removeExercise = (idx: number) => setExercises(prev => prev.filter((_, i) => i !== idx));

  const save = async () => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }
    if (exercises.length === 0) {
      Alert.alert("No exercises", "Add at least one exercise.");
      return;
    }

    setLoading(true);
    try {
      await createWorkout({ date, exercises });
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/workouts");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create workout");
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

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="p-6">
          <Text className="text-3xl font-bold mb-2 text-gray-900">New Workout</Text>
          <Text className="text-gray-500 mb-6">Track your training session</Text>

          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="bg-gray-100 rounded-full p-2 mr-3">
                <Ionicons name="calendar" size={20} color="#374151" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">Date</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  value={dateStr}
                  onChangeText={setDateStr}
                />
              </View>
            </View>
          </View>

          {exercises.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">Exercises</Text>
                <View className="bg-gray-100 rounded-full px-3 py-1">
                  <Text className="text-gray-700 font-semibold">{exercises.length}</Text>
                </View>
              </View>
              {exercises.map((ex, idx) => {
                const getModalityColor = (mod: string) => {
                  if (mod === "strength") return "bg-blue-100 text-blue-700";
                  if (mod === "cardio") return "bg-red-100 text-red-700";
                  return "bg-green-100 text-green-700";
                };
                return (
                  <View key={`${ex.name}-${idx}`} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="font-bold text-lg text-gray-900 mb-1">{ex.name}</Text>
                        <View className={`self-start px-2.5 py-1 rounded-full ${getModalityColor(ex.modality)}`}>
                          <Text className="text-xs font-semibold capitalize">{ex.modality}</Text>
                        </View>
                      </View>
                      <Pressable 
                        onPress={() => removeExercise(idx)} 
                        className="bg-red-50 rounded-full p-2"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {ex.modality === "strength" && ex.strengthSets?.map((st, i) => (
                        <View key={i} className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                          <Text className="text-blue-900 font-semibold">
                            {st.reps} × {formatWeight(st.weight, units)}
                          </Text>
                        </View>
                      ))}
                      {ex.modality === "cardio" && ex.cardioData && (
                        <View className="bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                          <Text className="text-red-900 font-semibold">
                            {formatDuration(ex.cardioData.duration)}
                            {ex.cardioData.distance ? ` • ${formatDistance(ex.cardioData.distance, units)}` : null}
                          </Text>
                        </View>
                      )}
                      {ex.modality === "calisthenics" && ex.calisthenicsSets?.map((st, i) => (
                        <View key={i} className="bg-green-50 rounded-xl px-3 py-2 border border-green-100">
                          <Text className="text-green-900 font-semibold">
                            {st.reps} reps
                            {st.duration ? ` (${formatDuration(st.duration)} hold)` : null}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-xl font-bold mb-4 text-gray-900">Add Exercise</Text>
            
            {!selectedExercise ? (
              <ExerciseSearch onSelect={handleExerciseSelect} />
            ) : (
              <View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-900">{selectedExercise.name}</Text>
                    <View className="flex-row items-center mt-2">
                      <View className={`px-2.5 py-1 rounded-full ${selectedExercise.modality === "strength" ? "bg-blue-100" : selectedExercise.modality === "cardio" ? "bg-red-100" : "bg-green-100"}`}>
                        <Text className="text-xs font-semibold capitalize">{selectedExercise.modality}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable 
                    onPress={() => setSelectedExercise(null)}
                    className="bg-gray-100 rounded-full px-4 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-gray-700 font-semibold">Change</Text>
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
                  className="bg-black rounded-xl px-4 py-4 mt-4 shadow-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">Add to Workout</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </View>

          <Pressable
            onPress={save}
            disabled={loading || exercises.length === 0}
            className={`rounded-xl px-6 py-4 shadow-lg ${loading || exercises.length === 0 ? "bg-gray-300" : "bg-black"}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <View className="flex-row items-center justify-center">
              {loading && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
              <Text className={`text-center font-bold text-base ${loading || exercises.length === 0 ? "text-gray-600" : "text-white"}`}>
                {loading ? "Saving..." : "Save Workout"}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}