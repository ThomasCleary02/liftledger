import React from "react";
import { Pressable, View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Timestamp } from "firebase/firestore";
import { Exercise } from "../lib/firestore/workouts";
import { usePreferences } from "../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../lib/utils/units";

type Props = {
  id: string;
  date: Date | Timestamp;
  exercises: Exercise[];
  totalVolume?: number;
  totalCardioDuration?: number;
  onPress?: () => void;
  onLongPress?: () => void;
};

const getModalityColor = (modality: string) => {
  switch (modality) {
    case "strength": return "bg-blue-100 text-blue-700";
    case "cardio": return "bg-red-100 text-red-700";
    case "calisthenics": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getModalityIcon = (modality: string) => {
  switch (modality) {
    case "strength": return "barbell";
    case "cardio": return "heart";
    case "calisthenics": return "body";
    default: return "fitness";
  }
};

export default function WorkoutCard({ id, date, exercises, totalVolume, totalCardioDuration, onPress, onLongPress }: Props) {
  const { units } = usePreferences();
  const d = (date as any)?.toDate ? (date as Timestamp).toDate() : (date as Date);
  const exerciseCount = exercises?.length ?? 0;
  
  const setCount = exercises?.reduce((sum, ex) => {
    if (ex.modality === "strength" && ex.strengthSets) {
      return sum + ex.strengthSets.length;
    }
    if (ex.modality === "calisthenics" && ex.calisthenicsSets) {
      return sum + ex.calisthenicsSets.length;
    }
    if (ex.modality === "cardio" && ex.cardioData) {
      return sum + 1;
    }
    return sum;
  }, 0) ?? 0;

  // Group exercises by modality
  const modalityCounts = exercises?.reduce((acc, ex) => {
    acc[ex.modality] = (acc[ex.modality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100"
      android_ripple={{ color: "#f3f4f6" }}
      style={({ pressed }) => ({ 
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }]
      })}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="font-bold text-lg text-gray-900 mb-1">{formatDate(d)}</Text>
          <View className="flex-row items-center gap-3 mb-2">
            <View className="flex-row items-center">
              <Ionicons name="list" size={14} color="#6b7280" />
              <Text className="text-gray-600 text-sm ml-1">{exerciseCount} exercises</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="repeat" size={14} color="#6b7280" />
              <Text className="text-gray-600 text-sm ml-1">{setCount} sets</Text>
            </View>
          </View>
        </View>
        <View className="bg-gray-50 rounded-full px-3 py-1">
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </View>
      </View>

      {/* Modality badges */}
      {Object.keys(modalityCounts).length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {Object.entries(modalityCounts).map(([modality, count]) => (
            <View key={modality} className={`flex-row items-center px-2.5 py-1 rounded-full ${getModalityColor(modality)}`}>
              <Ionicons name={getModalityIcon(modality) as any} size={12} color="currentColor" />
              <Text className="text-xs font-semibold ml-1 capitalize">{modality} ({count})</Text>
            </View>
          ))}
        </View>
      )}

      {/* Exercise preview */}
      <Text className="text-gray-700 text-sm mb-3 leading-5" numberOfLines={2}>
        {exercises?.slice(0, 3).map(e => e.name).join(" • ") || "No exercises"}
        {exerciseCount > 3 && "..."}
      </Text>

      {/* Stats */}
      {(totalVolume || totalCardioDuration) && (
        <View className="flex-row items-center gap-4 pt-3 border-t border-gray-100">
          {totalVolume && (
            <View className="flex-row items-center">
              <View className="bg-blue-100 rounded-full p-1.5 mr-2">
                <Ionicons name="barbell" size={14} color="#1e40af" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Volume</Text>
                <Text className="text-gray-900 font-semibold text-sm">{formatWeight(totalVolume, units)}</Text>
              </View>
            </View>
          )}
          {totalCardioDuration && (
            <View className="flex-row items-center">
              <View className="bg-red-100 rounded-full p-1.5 mr-2">
                <Ionicons name="heart" size={14} color="#dc2626" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Cardio</Text>
                <Text className="text-gray-900 font-semibold text-sm">{Math.round(totalCardioDuration / 60)} min</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}