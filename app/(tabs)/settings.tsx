import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../providers/Auth";
import { router } from "expo-router";
import { deleteUserAccount } from "../../lib/firestore/account";
import { getPreferences, UnitSystem, DefaultChartView } from "../../lib/preferences";
import Ionicons from "@expo/vector-icons/Ionicons";
import UnitsModal from "../../components/settings/UnitsModal";
import ChartViewModal from "../../components/settings/ChartViewModal";
import PRNotificationsModal from "../../components/settings/PRNotificationsModal";
import { usePreferences } from "../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../lib/utils/units";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Settings() {
  const { signOutUser, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [chartView, setChartView] = useState<DefaultChartView>("month");
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [prModalVisible, setPRModalVisible] = useState(false);
  const { units: contextUnits, defaultChartView, refresh: refreshPreferences } = usePreferences();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setUnits(prefs.units);
      setChartView(prefs.defaultChartView);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: signOutUser }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your workout data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserAccount();
              Alert.alert("Account Deleted", "Your account has been permanently deleted");
              // User will be automatically signed out
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete account");
            }
          }
        }
      ]
    );
  };

  const getUnitLabel = (unit: UnitSystem) => {
    return unit === "imperial" ? "Imperial (lb, mi)" : "Metric (kg, km)";
  };

  const getChartViewLabel = (view: DefaultChartView) => {
    const labels: Record<DefaultChartView, string> = {
      week: "Week",
      month: "Month",
      year: "Year",
    };
    return labels[view];
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200 px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Settings</Text>
        <Text className="text-gray-500 text-sm">Manage your account and preferences</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="p-6">

          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Profile</Text>
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="bg-gray-100 rounded-full p-3 mr-4">
                  <Ionicons name="person" size={24} color="#374151" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{user?.email || "User"}</Text>
                  <Text className="text-gray-500 text-sm">Email</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Preferences</Text>
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {loadingPrefs ? (
                <View className="p-5 items-center">
                  <ActivityIndicator size="small" color="#000" />
                </View>
              ) : (
                <>
                  <SettingItem
                    icon="scale"
                    title="Units"
                    subtitle={getUnitLabel(contextUnits)}
                    onPress={() => setUnitsModalVisible(true)}
                  />
                  <SettingItem
                    icon="stats-chart"
                    title="Default Chart View"
                    subtitle={getChartViewLabel(defaultChartView)}
                    onPress={() => setChartModalVisible(true)}
                  />
                </>
              )}
            </View>
          </View>

          {/* Analytics Settings */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Analytics</Text>
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <SettingItem
                icon="notifications"
                title="PR Notifications"
                subtitle="Get notified when you hit a PR"
                onPress={() => setPRModalVisible(true)}
              />
              <SettingItem
                icon="grid"
                title="Dashboard Widgets"
                subtitle="Customize your analytics view"
                onPress={() => Alert.alert("Coming Soon", "Widget customization coming soon")}
              />
            </View>
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Account</Text>
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <SettingItem
                icon="log-out"
                title="Sign Out"
                subtitle="Sign out of your account"
                onPress={handleSignOut}
                danger
              />
              <SettingItem
                icon="trash"
                title="Delete Account"
                subtitle="Permanently delete your account and data"
                onPress={handleDeleteAccount}
                danger
              />
            </View>
          </View>

          {/* Support Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Support</Text>
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <SettingItem
                icon="help-circle"
                title="Help & Support"
                subtitle="Get help with the app"
                onPress={() => Alert.alert("Help", "For support, please contact us at support@liftledger.com")}
              />
              <SettingItem
                icon="document-text"
                title="Terms & Privacy"
                subtitle="Read our terms and privacy policy"
                onPress={() => Alert.alert("Terms & Privacy", "Terms and privacy policy coming soon")}
              />
            </View>
          </View>

          {/* Dev Section (remove in production) */}
          {__DEV__ && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Development</Text>
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <SettingItem
                  icon="flask"
                  title="Seed Exercises"
                  subtitle="Populate exercise database"
                  onPress={() => router.push("/(dev)/seed-exercises")}
                />
              </View>
            </View>
          )}

          {/* App Info */}
          <View className="items-center mt-6 mb-8">
            <Text className="text-gray-400 text-sm">LiftLedger v1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <UnitsModal 
        visible={unitsModalVisible} 
        onClose={() => {
          setUnitsModalVisible(false);
          loadPreferences(); // Reload local state
        }}
        onSave={refreshPreferences} // Refresh global context
      />
      <ChartViewModal 
        visible={chartModalVisible} 
        onClose={() => {
          setChartModalVisible(false);
          loadPreferences();
        }}
        onSave={refreshPreferences} // Refresh global context
      />
      <PRNotificationsModal 
        visible={prModalVisible} 
        onClose={() => {
          setPRModalVisible(false);
          loadPreferences();
        }}
        onSave={refreshPreferences} // Refresh global context
      />
    </View>
  );
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 active:bg-gray-50"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className={`rounded-full p-2 mr-4 ${danger ? 'bg-red-100' : 'bg-gray-100'}`}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={danger ? "#dc2626" : "#374151"} 
        />
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        <Text className="text-gray-500 text-sm">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </Pressable>
  );
}