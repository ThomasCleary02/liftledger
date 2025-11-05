


import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ExercisePR } from "../../lib/analytics/types";
import { Workout } from "../../lib/firestore/workouts";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight, formatDistance, getDistanceUnit } from "../../lib/utils/units";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  prs: ExercisePR[];
  workouts: Workout[];
}

export default function PRsAnalyticsView({ prs, workouts }: Props) {
  const router = useRouter();
  const { units } = usePreferences();

  const groupedPRs = useMemo(() => {
    const strength = prs.filter(p => p.modality === "strength");
    const cardio = prs.filter(p => p.modality === "cardio");
    const calisthenics = prs.filter(p => p.modality === "calisthenics");

    return { strength, cardio, calisthenics };
  }, [prs]);

  const formatPRValue = (pr: ExercisePR): string => {
    if (pr.prType === "maxWeight") {
      return formatWeight(pr.value, units);
    } else if (pr.prType === "maxDistance") {
      return formatDistance(pr.value, units);
    } else if (pr.prType === "maxDuration") {
      const mins = Math.round(pr.value / 60);
      return `${mins} min`;
    } else if (pr.prType === "bestPace") {
      const mins = Math.floor(pr.value / 60);
      const secs = Math.round(pr.value % 60);
      const unit = units === "metric" ? "km" : "mi";
      return `${mins}:${secs.toString().padStart(2, '0')} /${unit}`;
    } else {
      return `${pr.value.toFixed(0)}${pr.prType === "maxReps" ? " reps" : ""}`;
    }
  };

  const getPRIcon = (pr: ExercisePR): string => {
    if (pr.modality === "strength") return "barbell";
    if (pr.modality === "cardio") return "heart";
    return "body";
  };

  const getPRColor = (pr: ExercisePR): string => {
    if (pr.modality === "strength") return "bg-blue-100 text-blue-700";
    if (pr.modality === "cardio") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  const handlePRPress = (workoutId: string) => {
    router.push(`/workout/${workoutId}`);
  };

  return (
    <ScrollView className="p-6">
      {/* Strength PRs */}
      {groupedPRs.strength.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <Ionicons name="barbell" size={20} color="#1e40af" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Strength PRs</Text>
          </View>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {groupedPRs.strength.slice(0, 15).map((pr, idx) => (
              <Pressable
                key={idx}
                onPress={() => handlePRPress(pr.workoutId)}
                className={`px-5 py-4 ${idx < groupedPRs.strength.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className={`rounded-full p-1.5 mr-3 ${getPRColor(pr)}`}>
                      <Ionicons name={getPRIcon(pr) as any} size={14} color="currentColor" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{pr.exerciseName}</Text>
                      <Text className="text-gray-500 text-sm capitalize">
                        {pr.prType.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="font-bold text-lg text-gray-900">{formatPRValue(pr)}</Text>
                    <Text className="text-gray-400 text-xs">{pr.date.toLocaleDateString()}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Cardio PRs */}
      {groupedPRs.cardio.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-red-100 rounded-full p-2 mr-3">
              <Ionicons name="heart" size={20} color="#dc2626" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Cardio PRs</Text>
          </View>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {groupedPRs.cardio.slice(0, 15).map((pr, idx) => (
              <Pressable
                key={idx}
                onPress={() => handlePRPress(pr.workoutId)}
                className={`px-5 py-4 ${idx < groupedPRs.cardio.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className={`rounded-full p-1.5 mr-3 ${getPRColor(pr)}`}>
                      <Ionicons name={getPRIcon(pr) as any} size={14} color="currentColor" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{pr.exerciseName}</Text>
                      <Text className="text-gray-500 text-sm capitalize">
                        {pr.prType.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="font-bold text-lg text-gray-900">{formatPRValue(pr)}</Text>
                    <Text className="text-gray-400 text-xs">{pr.date.toLocaleDateString()}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Calisthenics PRs */}
      {groupedPRs.calisthenics.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 rounded-full p-2 mr-3">
              <Ionicons name="body" size={20} color="#16a34a" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Calisthenics PRs</Text>
          </View>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {groupedPRs.calisthenics.slice(0, 15).map((pr, idx) => (
              <Pressable
                key={idx}
                onPress={() => handlePRPress(pr.workoutId)}
                className={`px-5 py-4 ${idx < groupedPRs.calisthenics.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className={`rounded-full p-1.5 mr-3 ${getPRColor(pr)}`}>
                      <Ionicons name={getPRIcon(pr) as any} size={14} color="currentColor" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{pr.exerciseName}</Text>
                      <Text className="text-gray-500 text-sm capitalize">
                        {pr.prType.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="font-bold text-lg text-gray-900">{formatPRValue(pr)}</Text>
                    <Text className="text-gray-400 text-xs">{pr.date.toLocaleDateString()}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {prs.length === 0 && (
        <View className="items-center justify-center py-12">
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-4 text-center">No personal records yet</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">Start logging workouts to track your PRs!</Text>
        </View>
      )}
    </ScrollView>
  );
}