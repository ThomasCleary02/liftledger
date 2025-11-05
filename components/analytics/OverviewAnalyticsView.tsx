


import React from "react";
import { View, Text } from "react-native";
import { AnalyticsSummary, TimePeriod } from "../../lib/analytics/types";
import { Workout } from "../../lib/firestore/workouts";
import { getVolumeDataPoints } from "../../lib/analytics/calculations";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../lib/utils/units";

interface Props {
  summary: AnalyticsSummary;
  workouts: Workout[];
  timePeriod: TimePeriod;
}

export default function OverviewAnalyticsView({ summary, workouts, timePeriod }: Props) {
  const volumeData = getVolumeDataPoints(workouts, timePeriod === "all" ? "month" : timePeriod);
  const { units } = usePreferences();

  return (
    <View className="p-6">
      {/* Overview Cards */}
      <View className="mb-6">
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon="barbell"
            label="Total Workouts"
            value={summary.totalWorkouts.toString()}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon="flame"
            label="Current Streak"
            value={`${summary.currentStreak} days`}
            color="bg-orange-100 text-orange-700"
          />
          <StatCard
            icon="trophy"
            label="Longest Streak"
            value={`${summary.longestStreak} days`}
            color="bg-yellow-100 text-yellow-700"
          />
          <StatCard
            icon="trending-up"
            label="Total Volume"
            value={formatWeight(summary.totalVolume, units)}
            color="bg-purple-100 text-purple-700"
          />
        </View>
      </View>

      {/* Favorite Exercise */}
      {summary.favoriteExercise && (
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3">
            <View className="bg-gray-100 rounded-full p-2 mr-3">
              <Ionicons name="star" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-sm">Favorite Exercise</Text>
              <Text className="text-lg font-bold text-gray-900">{summary.favoriteExercise}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View className="mb-6">
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <StatRow label="Total Volume" value={formatWeight(summary.totalVolume, units)} />
          <StatRow label="Cardio Distance" value={formatDistance(summary.totalCardioDistance, units)} />
          <StatRow label="Cardio Duration" value={`${Math.round(summary.totalCardioDuration / 60)} min`} />
          <StatRow label="Calisthenics Reps" value={summary.totalCalisthenicsReps.toLocaleString()} />
        </View>
      </View>

      {/* Volume Trend */}
      {volumeData.length > 0 && (
        <View className="mb-6">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-sm mb-4">Last {volumeData.length} periods</Text>
            <View className="flex-row items-end justify-between h-40">
              {volumeData.slice(-8).map((point, idx) => {
                const maxVolume = Math.max(...volumeData.map(p => p.volume));
                const height = maxVolume > 0 ? (point.volume / maxVolume) * 100 : 0;
                return (
                  <View key={idx} className="flex-1 items-center mx-0.5">
                    <View className="relative w-full items-center">
                      <View 
                        className="bg-blue-500 rounded-t w-full"
                        style={{ height: `${height}%`, minHeight: 4 }}
                      />
                      <Text className="text-gray-400 text-xs mt-2 text-center" numberOfLines={1}>
                        {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      {point.volume > 0 && (
                        <Text className="text-gray-600 text-xs font-semibold mt-1">
                          {Math.round(point.volume / 1000)}k
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <Text className="text-gray-600">{label}</Text>
      <Text className="font-semibold text-gray-900">{value}</Text>
    </View>
  );
}