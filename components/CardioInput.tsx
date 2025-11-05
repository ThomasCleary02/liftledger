// components/CardioInput.tsx
import React from "react";
import { View, Text, TextInput } from "react-native";

export interface CardioData {
  duration: string; // minutes (stored as string for input, converted to seconds when saving)
  distance: string; // miles
}

interface CardioInputProps {
  data: CardioData;
  onDataChange: (data: CardioData) => void;
}

export default function CardioInput({ data, onDataChange }: CardioInputProps) {
  return (
    <View>
      <View className="mb-4">
        <Text className="font-medium text-gray-700 mb-2">Duration</Text>
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-3 py-3"
            keyboardType="numeric"
            value={data.duration}
            onChangeText={(v) => onDataChange({ ...data, duration: v })}
            placeholder="Minutes (e.g., 30)"
          />
          <Text className="ml-3 text-gray-600 w-20 font-medium">minutes</Text>
        </View>
      </View>

      <View>
        <Text className="font-medium text-gray-700 mb-2">Distance (optional)</Text>
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-3 py-3"
            keyboardType="numeric"
            value={data.distance}
            onChangeText={(v) => onDataChange({ ...data, distance: v })}
            placeholder="Miles"
          />
          <Text className="ml-3 text-gray-600 w-20 font-medium">miles</Text>
        </View>
      </View>
    </View>
  );
}