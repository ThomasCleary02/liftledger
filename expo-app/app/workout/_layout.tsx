import React from "react";
import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen 
        name="new" 
        options={{ 
          title: "New Workout",
          presentation: "card", // Ensure proper iOS navigation
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: "Workout",
          presentation: "card",
        }} 
      />
    </Stack>
  );
}