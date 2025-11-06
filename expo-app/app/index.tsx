import { Redirect } from "expo-router";
import { useAuth } from "../providers/Auth";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  // Redirect to appropriate route based on auth state
  if (user) {
    return <Redirect href="/(tabs)/workouts" />;
  }

  return <Redirect href="/(auth)/login" />;
}
