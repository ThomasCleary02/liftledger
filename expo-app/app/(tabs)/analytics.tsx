import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listWorkouts, Workout } from "../../lib/firestore/workouts";
import { getAllExercises } from "../../lib/firestore/exercises";
import { 
  getAnalyticsSummary, 
  getStrengthAnalytics, 
  getCardioAnalytics,
  filterWorkoutsByPeriod,
  findAllPRs 
} from "../../lib/analytics/calculations";
import { AnalyticsSummary, ExercisePR, TimePeriod } from "../../lib/analytics/types";
import { ExerciseDoc } from "../../lib/firestore/exercises";
import Ionicons from "@expo/vector-icons/Ionicons";
import StrengthAnalyticsView from "../../components/analytics/StrengthAnalyticsView";
import CardioAnalyticsView from "../../components/analytics/CardioAnalyticsView";
import PRsAnalyticsView from "../../components/analytics/PRsAnalyticsView";
import OverviewAnalyticsView from "../../components/analytics/OverviewAnalyticsView";
import { usePreferences } from "../../lib/hooks/usePreferences";

type TabType = "overview" | "strength" | "cardio" | "prs";

export default function Analytics() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Map<string, ExerciseDoc>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [prs, setPRs] = useState<ExercisePR[]>([]);
  const { defaultChartView } = usePreferences();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (defaultChartView && defaultChartView !== timePeriod) {
      setTimePeriod(defaultChartView);
    }
  }, [defaultChartView]);

  useEffect(() => {
    if (workouts.length > 0) {
      const filtered = filterWorkoutsByPeriod(workouts, timePeriod);
      const analyticsSummary = getAnalyticsSummary(filtered, exercises);
      setSummary(analyticsSummary);
    }
  }, [timePeriod, workouts, exercises]);

  const loadData = async () => {
    try {
      const [workoutData, exerciseData] = await Promise.all([
        listWorkouts({ limit: 1000 }),
        getAllExercises(),
      ]);
      
      setWorkouts(workoutData);
      
      // Create exercise map for quick lookup
      const exerciseMap = new Map<string, ExerciseDoc>();
      exerciseData.forEach((ex: ExerciseDoc) => exerciseMap.set(ex.id, ex));
      setExercises(exerciseMap);
      
      // Calculate analytics - now pass exercises map
      const analyticsSummary = getAnalyticsSummary(workoutData, exerciseMap);
      const allPRs = findAllPRs(workoutData);
      
      setSummary(analyticsSummary);
      setPRs(allPRs);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredWorkouts = filterWorkoutsByPeriod(workouts, timePeriod);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading analytics...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">No data available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Analytics</Text>
          <Text className="text-gray-500 text-sm">Track your progress</Text>
        </View>
        
        {/* Time Period Filter */}
        <View className="px-6 pb-3 border-b border-gray-100">
          <View className="flex-row items-center justify-end">
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              {(["week", "month", "year", "all"] as TimePeriod[]).map((period) => (
                <Pressable
                  key={period}
                  onPress={() => setTimePeriod(period)}
                  className={`px-3 py-1 rounded ${timePeriod === period ? "bg-black" : ""}`}
                >
                  <Text className={`text-xs font-semibold ${timePeriod === period ? "text-white" : "text-gray-600"}`}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row">
          {([
            { id: "overview" as TabType, label: "Overview", icon: "stats-chart" },
            { id: "strength" as TabType, label: "Strength", icon: "barbell" },
            { id: "cardio" as TabType, label: "Cardio", icon: "heart" },
            { id: "prs" as TabType, label: "PRs", icon: "trophy" },
          ]).map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === tab.id ? "border-black" : "border-transparent"
              }`}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.id ? "#000" : "#9ca3af"} 
              />
              <Text className={`text-xs mt-1 font-semibold ${
                activeTab === tab.id ? "text-black" : "text-gray-500"
              }`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1" 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {activeTab === "overview" && (
          <OverviewAnalyticsView 
            summary={summary} 
            workouts={filteredWorkouts}
            timePeriod={timePeriod}
          />
        )}
        {activeTab === "strength" && (
          <StrengthAnalyticsView 
            workouts={filteredWorkouts}
            exercises={exercises}
            timePeriod={timePeriod}
          />
        )}
        {activeTab === "cardio" && (
          <CardioAnalyticsView 
            workouts={filteredWorkouts}
            timePeriod={timePeriod}
          />
        )}
        {activeTab === "prs" && (
          <PRsAnalyticsView 
            prs={prs}
            workouts={workouts}
          />
        )}
      </ScrollView>
    </View>
  );
}