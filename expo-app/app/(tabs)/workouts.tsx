import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";

export default function Workouts() {
  const router = useRouter();

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.replace(`/day/${today}`);
  }, [router]);
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#000" />
      <Text className="text-gray-500 mt-4">Redirecting...</Text>
    </View>
  );
}