import React from "react";
import { Tabs } from "expo-router";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../providers/Auth";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false, // Disable default headers
        tabBarActiveTintColor: "black",
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case "workouts":
              iconName = focused ? "barbell" : "barbell-outline";
              break;
            case "analytics":
              iconName = focused ? "stats-chart" : "stats-chart-outline";
              break;
            case "friends":
              iconName = focused ? "people" : "people-outline";
              break;
            case "settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }
          return <Ionicons name={iconName} color={color} size={size} />;
        }
      })}
    >
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}