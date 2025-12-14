


import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ExerciseDoc } from "../../lib/firestore/exercises";
import { getStrengthAnalytics } from "../../lib/analytics/calculations";
import { TimePeriod } from "../../lib/analytics/types";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight } from "../../lib/utils/units";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Day } from "../../lib/firestore/days";

interface Props {
  days: Day[];
  exercises: Map<string, ExerciseDoc>;
  timePeriod: TimePeriod;
}

export default function StrengthAnalyticsView({ days, exercises, timePeriod }: Props) {
  const strengthAnalytics = getStrengthAnalytics(days, exercises, timePeriod);
  const { units } = usePreferences();

  return (
    <ScrollView className="p-6">
      {/* Summary Stats */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-700 mb-3">Summary</Text>
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon="barbell"
            label="Total Volume"
            value={formatWeight(strengthAnalytics.totalVolume, units)}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon="trending-up"
            label="Avg/Workout"
            value={formatWeight(strengthAnalytics.averageVolumePerWorkout, units)}
            color="bg-purple-100 text-purple-700"
          />
          <StatCard
            icon="trophy"
            label="Max Workout"
            value={formatWeight(strengthAnalytics.maxVolumeWorkout, units)}
            color="bg-yellow-100 text-yellow-700"
          />
        </View>
      </View>

      {/* Volume Trend */}
      {strengthAnalytics.volumeTrend.length > 0 && (
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Volume Trend</Text>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-end justify-between h-40">
              {strengthAnalytics.volumeTrend.slice(-8).map((point, idx) => {
                const maxVolume = Math.max(...strengthAnalytics.volumeTrend.map(p => p.volume));
                const height = maxVolume > 0 ? (point.volume / maxVolume) * 100 : 0;
                return (
                  <View key={idx} className="flex-1 items-center mx-0.5">
                    <View 
                      className="bg-blue-500 rounded-t w-full"
                      style={{ height: `${height}%`, minHeight: 4 }}
                    />
                    <Text className="text-gray-400 text-xs mt-2 text-center" numberOfLines={1}>
                      {point.date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Top Exercises */}
      {strengthAnalytics.exercisesByFrequency.length > 0 && (
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Most Performed Exercises</Text>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {strengthAnalytics.exercisesByFrequency.slice(0, 10).map((exercise, idx) => (
              <View key={idx} className={`px-5 py-4 ${idx < strengthAnalytics.exercisesByFrequency.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{exercise.name}</Text>
                    <Text className="text-gray-500 text-sm">{exercise.count} workouts</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-lg text-gray-900">{formatWeight(exercise.maxWeight, units)}</Text>
                    <Text className="text-gray-400 text-xs">Max Weight</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Muscle Group Distribution */}
      {strengthAnalytics.volumeByMuscleGroup.length > 0 && (
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Volume by Muscle Group</Text>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {strengthAnalytics.volumeByMuscleGroup.map((group, idx) => {
              const totalVolume = strengthAnalytics.volumeByMuscleGroup.reduce((sum, g) => sum + g.volume, 0);
              const percentage = totalVolume > 0 ? (group.volume / totalVolume) * 100 : 0;
              return (
                <View key={idx} className="mb-4 last:mb-0">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-semibold text-gray-900 capitalize">
                      {group.muscleGroup.replace(/_/g, " ")}
                    </Text>
                    <Text className="text-gray-600 font-semibold">
                      {Math.round(percentage)}% • {formatWeight(group.volume, units)}
                    </Text>
                  </View>
                  <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">
                    {group.frequency} workouts • {group.exercises} exercises
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm border border-gray-100">
      <View className={`rounded-full p-2 w-12 h-12 items-center justify-center mb-3 ${color}`}>
        <Ionicons name={icon as any} size={24} color="currentColor" />
      </View>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
    </View>
  );
}