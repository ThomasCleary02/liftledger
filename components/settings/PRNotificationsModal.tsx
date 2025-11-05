import React, { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, Alert, Switch } from "react-native";
import { getPreferences, updatePRNotifications } from "../../lib/preferences";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void; // Add this callback
}

export default function PRNotificationsModal({ visible, onClose, onSave }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setEnabled(prefs.prNotifications);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePRNotifications(enabled);
      Alert.alert("Success", "PR notifications " + (enabled ? "enabled" : "disabled"));
      onSave?.(); // Call refresh callback
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">PR Notifications</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <Text className="text-gray-600 mb-6">
            Get notified when you achieve a new personal record
          </Text>

          <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">Enable Notifications</Text>
              <Text className="text-gray-500 text-sm">
                Receive notifications for new PRs
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={loading}
            className="bg-black rounded-xl py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text className="text-white font-bold text-center text-base">
              {loading ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
