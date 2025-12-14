import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db, auth, friendsService } from "../../lib/firebase";
import { fetchDaysForLeaderboard } from "@liftledger/shared/firestore/leaderboards";
import {
  getVolumeLeaderboard,
  getCardioDistanceLeaderboard,
  getConsistencyLeaderboard,
  type LeaderboardTimePeriod,
} from "@liftledger/shared/analytics/leaderboards";
import { useAuth } from "../../providers/Auth";
import { formatWeight, formatDistance } from "../../lib/utils/units";
import { usePreferences } from "../../lib/hooks/usePreferences";
import Ionicons from "@expo/vector-icons/Ionicons";
import { accountService } from "../../lib/firebase";

type MetricType = "volume" | "cardio" | "consistency";

export default function Leaderboards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { units } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<MetricType>("volume");
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>("7days");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLeaderboard();
  }, [metric, timePeriod]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const daysByUser = await fetchDaysForLeaderboard(db, auth);

      let data: any[] = [];
      if (metric === "volume") {
        data = getVolumeLeaderboard(daysByUser, timePeriod);
      } else if (metric === "cardio") {
        data = getCardioDistanceLeaderboard(daysByUser, timePeriod);
      } else {
        data = getConsistencyLeaderboard(daysByUser, timePeriod);
      }

      setLeaderboardData(data);
      
      // Fetch usernames for all users in the leaderboard
      const userIds = Array.from(new Set(data.map((entry) => entry.userId)));
      const usernameMap: Record<string, string> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const username = await accountService.getUsernameForUser(userId);
            if (username) {
              usernameMap[userId] = username;
            }
          } catch (error) {
            console.error(`Error fetching username for ${userId}:`, error);
          }
        })
      );
      setUsernames(usernameMap);
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
  };

  const formatValue = (value: number): string => {
    if (metric === "volume") {
      return formatWeight(value, units);
    } else if (metric === "cardio") {
      return formatDistance(value, units);
    } else {
      return `${value} days`;
    }
  };

  const getMetricLabel = (): string => {
    if (metric === "volume") return "Volume";
    if (metric === "cardio") return "Cardio Distance";
    return "Consistency";
  };

  const getTimePeriodLabel = (): string => {
    if (timePeriod === "7days") return "7 Days";
    if (timePeriod === "30days") return "30 Days";
    return "All Time";
  };

  if (loading && leaderboardData.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Pressable onPress={() => router.back()} className="mb-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Leaderboards</Text>
          <Text className="text-gray-500 text-sm">Compete with your friends</Text>
        </View>

        {/* Metric Selector */}
        <View className="px-6 pb-3 border-b border-gray-100">
          <View className="flex-row gap-2">
            {(["volume", "cardio", "consistency"] as MetricType[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMetric(m)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  metric === m ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold text-center ${
                    metric === m ? "text-white" : "text-gray-600"
                  }`}
                >
                  {m === "volume" ? "Volume" : m === "cardio" ? "Cardio" : "Consistency"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Period Filter */}
        <View className="px-6 pb-3 border-b border-gray-100">
          <View className="flex-row items-center justify-end">
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              {(["7days", "30days", "all"] as LeaderboardTimePeriod[]).map((period) => (
                <Pressable
                  key={period}
                  onPress={() => setTimePeriod(period)}
                  className={`px-3 py-1 rounded ${timePeriod === period ? "bg-black" : ""}`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      timePeriod === period ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {period === "7days" ? "7D" : period === "30days" ? "30D" : "All"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="p-6">
          {leaderboardData.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-center">
                No leaderboard data yet. Add friends and start logging workouts!
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {leaderboardData.map((entry, index) => {
                const isCurrentUser = entry.userId === user?.uid;
                return (
                  <View
                    key={entry.userId}
                    className={`flex-row items-center justify-between px-5 py-4 ${
                      index < leaderboardData.length - 1 ? "border-b border-gray-100" : ""
                    } ${isCurrentUser ? "bg-blue-50" : ""}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          entry.rank === 1
                            ? "bg-yellow-100"
                            : entry.rank === 2
                            ? "bg-gray-100"
                            : entry.rank === 3
                            ? "bg-orange-100"
                            : "bg-gray-50"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            entry.rank === 1
                              ? "text-yellow-700"
                              : entry.rank === 2
                              ? "text-gray-700"
                              : entry.rank === 3
                              ? "text-orange-700"
                              : "text-gray-600"
                          }`}
                        >
                          {entry.rank}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                          {isCurrentUser 
                            ? "You" 
                            : usernames[entry.userId] || entry.userId.substring(0, 8)}
                        </Text>
                        {isCurrentUser && (
                          <Text className="text-xs text-blue-600 mt-0.5">Your rank</Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-lg font-bold text-gray-900">{formatValue(entry.value)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
