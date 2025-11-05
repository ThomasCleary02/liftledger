import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { seedExercises } from "../../lib/firestore/exercises";
import exercisesData from "../../assets/exercises.json";

export default function SeedExercises() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await seedExercises(exercisesData as any);
      setDone(true);
      Alert.alert("Success", `Seeded ${exercisesData.length} exercises into Firestore`);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Seed failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-xl font-semibold mb-4">Seed Exercises</Text>
      <Text className="text-gray-600 mb-6 text-center">
        This will populate the Firestore exercises collection with {exercisesData.length} exercises.
      </Text>
      {done ? (
        <Text className="text-green-600 font-semibold mb-4">✓ Seeded successfully!</Text>
      ) : null}
      <Pressable
        onPress={run}
        disabled={loading || done}
        className={`rounded-lg px-6 py-3 ${loading || done ? "bg-gray-300" : "bg-black"}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={`font-semibold ${loading || done ? "text-gray-600" : "text-white"}`}>
            {done ? "Already Seeded" : "Seed Now"}
          </Text>
        )}
      </Pressable>
      <Text className="text-gray-500 mt-4 text-center text-sm">
        Note: This is safe to run multiple times (it will overwrite existing exercises).
      </Text>
    </View>
  );
}