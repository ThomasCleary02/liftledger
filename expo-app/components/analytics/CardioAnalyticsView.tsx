


import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Day } from "../../lib/firestore/days";
import { getCardioAnalytics } from "../../lib/analytics/calculations";
import { TimePeriod } from "../../lib/analytics/types";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatDistance, getDistanceUnit } from "../../lib/utils/units";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  days: Day[];
  timePeriod: TimePeriod;
}

export default function CardioAnalyticsView({ days, timePeriod }: Props) {
  const cardioAnalytics = getCardioAnalytics(days, timePeriod);
  const { units } = usePreferences();

  const formatPace = (secondsPerMile: number): string => {
    if (!isFinite(secondsPerMile) || secondsPerMile === 0) return "N/A";
    const mins = Math.floor(secondsPerMile / 60);
    const secs = Math.round(secondsPerMile % 60);
    const unit = units === "metric" ? "km" : "mi";
    return `${mins}:${secs.toString().padStart(2, '0')} /${unit}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <ScrollView className="p-6">
      {/* Summary Stats */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Cardio Summary</Text>
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon="map"
            label="Total Distance"
            value={formatDistance(cardioAnalytics.totalDistance, units)}
            color="bg-red-100 text-red-700"
          />
          <StatCard
            icon="time"
            label="Total Duration"
            value={formatDuration(cardioAnalytics.totalDuration)}
            color="bg-orange-100 text-orange-700"
          />
          <StatCard
            icon="speedometer"
            label="Avg Pace"
            value={formatPace(cardioAnalytics.averagePace)}
            color="bg-pink-100 text-pink-700"
          />
          <StatCard
            icon="trophy"
            label="Best Pace"
            value={formatPace(cardioAnalytics.bestPace)}
            color="bg-yellow-100 text-yellow-700"
          />
        </View>
      </View>

      {/* PRs */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Personal Records</Text>
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <PRRow label="Longest Distance" value={formatDistance(cardioAnalytics.longestDistance, units)} />
          <PRRow label="Longest Duration" value={formatDuration(cardioAnalytics.longestDuration)} />
          <PRRow label="Best Pace" value={formatPace(cardioAnalytics.bestPace)} />
        </View>
      </View>

      {/* Distance Trend */}
      {cardioAnalytics.distanceTrend.length > 0 && (
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Distance Trend</Text>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-end justify-between h-40">
              {cardioAnalytics.distanceTrend.slice(-8).map((point, idx) => {
                const maxDistance = Math.max(...cardioAnalytics.distanceTrend.map(p => p.distance));
                const height = maxDistance > 0 ? (point.distance / maxDistance) * 100 : 0;
                return (
                  <View key={idx} className="flex-1 items-center mx-0.5">
                    <View 
                      className="bg-red-500 rounded-t w-full"
                      style={{ height: `${height}%`, minHeight: 4 }}
                    />
                    <Text className="text-gray-400 text-xs mt-2 text-center" numberOfLines={1}>
                      {point.date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    {point.distance > 0 && (
                      <Text className="text-gray-600 text-xs font-semibold mt-1">
                        {formatDistance(point.distance, units)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Top Exercises */}
      {cardioAnalytics.exercisesByFrequency.length > 0 && (
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Most Performed Cardio</Text>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {cardioAnalytics.exercisesByFrequency.slice(0, 10).map((exercise, idx) => (
              <View key={idx} className={`px-5 py-4 ${idx < cardioAnalytics.exercisesByFrequency.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{exercise.name}</Text>
                    <Text className="text-gray-500 text-sm">{exercise.count} sessions</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-lg text-gray-900">{formatDistance(exercise.totalDistance, units)}</Text>
                    <Text className="text-gray-400 text-xs">Total Distance</Text>
                  </View>
                </View>
              </View>
            ))}
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

function PRRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <Text className="text-gray-600">{label}</Text>
      <Text className="font-semibold text-gray-900">{value}</Text>
    </View>
  );
}