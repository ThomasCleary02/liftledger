


import React, { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, Alert } from "react-native";
import { UnitSystem, getPreferences, updateUnitSystem } from "../../lib/preferences";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void; // Add this callback
}

export default function UnitsModal({ visible, onClose, onSave }: Props) {
  const [selectedUnit, setSelectedUnit] = useState<UnitSystem>("imperial");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setSelectedUnit(prefs.units);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUnitSystem(selectedUnit);
      Alert.alert("Success", "Unit preference saved");
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
            <Text className="text-2xl font-bold text-gray-900">Units</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <Text className="text-gray-600 mb-4">Choose your preferred unit system</Text>

          <View className="space-y-3">
            <Pressable
              onPress={() => setSelectedUnit("imperial")}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedUnit === "imperial" 
                  ? "bg-blue-50 border-blue-500" 
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                selectedUnit === "imperial" ? "border-blue-500" : "border-gray-300"
              }`}>
                {selectedUnit === "imperial" && (
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Imperial</Text>
                <Text className="text-gray-500 text-sm">Pounds (lb), Miles (mi)</Text>
              </View>
              {selectedUnit === "imperial" && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" />
              )}
            </Pressable>

            <Pressable
              onPress={() => setSelectedUnit("metric")}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedUnit === "metric" 
                  ? "bg-blue-50 border-blue-500" 
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                selectedUnit === "metric" ? "border-blue-500" : "border-gray-300"
              }`}>
                {selectedUnit === "metric" && (
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Metric</Text>
                <Text className="text-gray-500 text-sm">Kilograms (kg), Kilometers (km)</Text>
              </View>
              {selectedUnit === "metric" && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" />
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={loading}
            className="bg-black rounded-xl py-4 mt-6"
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