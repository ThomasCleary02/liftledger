import React from "react";
import { View, Text, Pressable } from "react-native";
import { Exercise } from "../lib/firestore/workouts";
import { usePreferences } from "../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../lib/utils/units";

type Props = {
  exercise: Exercise;
  onRemove?: () => void;
};

export default function ExerciseRow({ exercise, onRemove }: Props) {
  const { units } = usePreferences();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const getDisplayText = () => {
    if (exercise.modality === "strength" && exercise.strengthSets) {
      const totalSets = exercise.strengthSets.length;
      const totalReps = exercise.strengthSets.reduce((sum, s) => sum + s.reps, 0);
      const avgWeight = exercise.strengthSets.reduce((sum, s) => sum + s.weight, 0) / totalSets;
      return `Sets: ${totalSets}  •  Reps: ${totalReps}  •  Avg Weight: ${formatWeight(avgWeight, units)}`;
    }
    if (exercise.modality === "cardio" && exercise.cardioData) {
      const duration = formatDuration(exercise.cardioData.duration);
      const distance = exercise.cardioData.distance ? ` • ${formatDistance(exercise.cardioData.distance, units)}` : "";
      return `Duration: ${duration}${distance}`;
    }
    if (exercise.modality === "calisthenics" && exercise.calisthenicsSets) {
      const totalSets = exercise.calisthenicsSets.length;
      const totalReps = exercise.calisthenicsSets.reduce((sum, s) => sum + s.reps, 0);
      return `Sets: ${totalSets}  •  Reps: ${totalReps}`;
    }
    return "No data";
  };

  return (
    <View className="mb-3 bg-white border border-gray-200 rounded-lg p-4">
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="font-semibold">{exercise.name}</Text>
          <Text className="text-gray-500 text-xs capitalize">{exercise.modality}</Text>
        </View>
        {onRemove ? (
          <Pressable onPress={onRemove}>
            <Text className="text-red-600">Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-gray-600 mt-1">{getDisplayText()}</Text>
    </View>
  );
}