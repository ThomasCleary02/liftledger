import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../providers/Auth";
import { accountService } from "../../lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AccountSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsername();
    }
  }, [user]);
  
  const loadUsername = async () => {
    try {
      setLoadingUsername(true);
      const currentUsername = await accountService.getUsername();
      setUsername(currentUsername || "");
      setUsernameInput(currentUsername || "");
    } catch (error) {
      console.error("Error loading username:", error);
    } finally {
      setLoadingUsername(false);
    }
  };
  
  const handleSaveUsername = async () => {
    try {
      setSavingUsername(true);
      await accountService.setUsername(usernameInput);
      setUsername(usernameInput);
      Alert.alert("Success", "Username updated successfully");
    } catch (error: any) {
      console.error("Error saving username", error);
      Alert.alert("Error", error?.message || "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Pressable onPress={() => router.back()} className="mb-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Account Settings</Text>
          <Text className="text-gray-500 text-sm">Customize your profile</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="p-6">
          {/* Profile Picture Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Profile Picture</Text>
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="bg-gray-100 rounded-full p-4 mr-4">
                  <Ionicons name="person" size={32} color="#9ca3af" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Profile Picture</Text>
                  <Text className="text-gray-500 text-sm">Coming soon</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Information Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Account Information</Text>
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                <Text className="font-semibold text-gray-900">{user?.email || "Not set"}</Text>
                <Text className="text-xs text-gray-500 mt-1">Your email address cannot be changed</Text>
              </View>
              
              {/* Username */}
              <View className="border-t border-gray-100 pt-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Username</Text>
                {loadingUsername ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <View className="flex-row gap-2">
                    <TextInput
                      value={usernameInput}
                      onChangeText={setUsernameInput}
                      placeholder="Enter username"
                      maxLength={20}
                      style={{ 
                        flex: 1,
                        borderWidth: 1, 
                        borderColor: "#d1d5db", 
                        borderRadius: 8, 
                        padding: 8,
                        fontSize: 14
                      }}
                    />
                    <Pressable
                      onPress={handleSaveUsername}
                      disabled={savingUsername || usernameInput === username || !usernameInput.trim()}
                      className={`rounded-lg px-4 py-2 ${savingUsername || usernameInput === username || !usernameInput.trim() ? 'bg-gray-300' : 'bg-black'}`}
                      style={{ justifyContent: 'center', alignItems: 'center' }}
                    >
                      {savingUsername ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className={`text-sm font-semibold ${savingUsername || usernameInput === username || !usernameInput.trim() ? 'text-gray-500' : 'text-white'}`}>
                          Save
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
                <Text className="mt-1 text-xs text-gray-500">
                  3-20 characters, letters, numbers, underscores, and hyphens only
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
