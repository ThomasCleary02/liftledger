import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listWorkouts, subscribeToWorkouts, deleteWorkout, Workout } from "../../lib/firestore/workouts";
import WorkoutCard from "../../components/WorkoutCard";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Workouts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let first = true;
    const unsub = subscribeToWorkouts(
      ws => {
        setItems(ws);
        if (first) { first = false; setLoading(false); }
      },
      err => {
        console.error(err);
        if (first) { first = false; setLoading(false); }
      },
      { limit: 50, order: "desc" }
    );
    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await listWorkouts({ limit: 50, order: "desc" });
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  };

  const keyExtractor = useMemo(() => (w: Workout) => w.id, []);
  const renderItem = ({ item }: { item: Workout }) => {
    const goTo = () => router.push(`/workout/${item.id}`);
    const confirmDelete = () => {
      Alert.alert("Delete workout", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try { await deleteWorkout(item.id); }
            catch (e: any) { Alert.alert("Error", e?.message ?? "Failed to delete"); }
          }
        }
      ]);
    };
    return (
      <WorkoutCard
        id={item.id}
        date={item.date}
        exercises={item.exercises}
        totalVolume={item.totalVolume}
        totalCardioDuration={item.totalCardioDuration}
        onPress={goTo}
        onLongPress={confirmDelete}
      />
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4">Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200 px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <View>
          <Text className="text-3xl font-bold text-gray-900">Workouts</Text>
          <Text className="text-gray-500 text-sm mt-1">Track your training</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 px-6">
            <View className="bg-gray-100 rounded-full p-6 mb-4">
              <Ionicons name="fitness-outline" size={48} color="#9ca3af" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">No workouts yet</Text>
            <Text className="text-gray-500 mb-8 text-center leading-6">
              Start tracking your fitness journey by creating your first workout.
            </Text>
            <Pressable 
              onPress={() => router.push("/workout/new")} 
              className="bg-black rounded-xl px-6 py-4 shadow-lg"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2 text-base">Create First Workout</Text>
              </View>
            </Pressable>
          </View>
        }
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
      />
      
      {/* Floating Add Button - Bottom Right */}
      <Pressable 
        onPress={() => router.push("/workout/new")} 
        className="absolute bottom-8 right-6 bg-black rounded-full px-6 py-5 shadow-xl"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={({ pressed }) => ({ 
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }]
        })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}