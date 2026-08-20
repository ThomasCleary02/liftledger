import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Day } from "../../lib/firestore/days";
import { getCardioAnalytics } from "../../lib/analytics/calculations";
import { TimePeriod } from "../../lib/analytics/types";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatDistance, formatCardioDuration, formatPace, formatSpeed } from "../../lib/utils/units";
import { CARDIO_ACTIVITY_LABELS, cardioPaceKind } from "@liftledger/shared";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  days: Day[];
  timePeriod: TimePeriod;
}

export default function CardioAnalyticsView({ days, timePeriod }: Props) {
  const cardioAnalytics = getCardioAnalytics(days, timePeriod);
  const { units } = usePreferences();

  if (cardioAnalytics.sessions === 0) {
    return (
      <ScrollView className="p-6">
        <Text className="text-gray-500 text-center">No cardio in this period.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="p-6">
      <View className="flex-row flex-wrap gap-3 mb-6">
        <StatCard label="Sessions" value={String(cardioAnalytics.sessions)} />
        <StatCard label="Total time" value={formatCardioDuration(cardioAnalytics.totalDuration)} />
      </View>

      {cardioAnalytics.byType.map((t) => {
        const kind = cardioPaceKind(t.type);
        return (
          <View key={t.type} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              {CARDIO_ACTIVITY_LABELS[t.type]}
            </Text>
            <PRRow label="Time" value={formatCardioDuration(t.totalDuration)} />
            {t.totalDistance > 0 && (
              <PRRow label="Distance" value={formatDistance(t.totalDistance, units)} />
            )}
            {kind === "pace" && (
              <>
                <PRRow label="Avg pace" value={formatPace(t.averagePace || 0, units)} />
                <PRRow label="Best pace" value={formatPace(t.bestPace || 0, units)} />
              </>
            )}
            {kind === "speed" && (
              <>
                <PRRow label="Avg speed" value={formatSpeed(t.averageSpeed || 0, units)} />
                <PRRow label="Top speed" value={formatSpeed(t.bestSpeed || 0, units)} />
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm border border-gray-100">
      <View className="rounded-full p-2 w-12 h-12 items-center justify-center mb-3 bg-red-100">
        <Ionicons name="heart" size={24} color="#b91c1c" />
      </View>
      <Text className="text-gray-500 text-xs mb-1">{label}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function PRRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
      <Text className="text-gray-600">{label}</Text>
      <Text className="font-semibold text-gray-900">{value}</Text>
    </View>
  );
}
