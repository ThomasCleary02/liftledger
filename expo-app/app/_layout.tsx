import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AuthProvider } from "../providers/Auth";
import { PreferencesProvider } from "../lib/hooks/usePreferences";
import "../global.css";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <PreferencesProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </PreferencesProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}