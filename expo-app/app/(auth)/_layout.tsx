import React from "react";
import { Redirect, Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../providers/Auth";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/workouts" />;
  }

  return <Slot />;
}