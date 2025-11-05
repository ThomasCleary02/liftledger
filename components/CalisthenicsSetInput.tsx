// components/CalisthenicsSetInput.tsx
import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";

export interface CalisthenicsSet {
  reps: string;
  duration?: string; // seconds, for holds like planks
}

interface CalisthenicsSetInputProps {
  sets: CalisthenicsSet[];
  onSetsChange: (sets: CalisthenicsSet[]) => void;
  showDuration?: boolean; // for exercises like planks
}

export default function CalisthenicsSetInput({ 
  sets, 
  onSetsChange, 
  showDuration = false 
}: CalisthenicsSetInputProps) {
  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    onSetsChange([...sets, lastSet ? { ...lastSet } : { reps: "10" }]);
  };

  const removeSet = (idx: number) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof CalisthenicsSet, value: string) => {
    onSetsChange(sets.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <View>
      <Text className="font-medium text-gray-700 mb-2">Sets</Text>
      {sets.map((set, idx) => (
        <View key={idx} className="mb-2">
          <View className="flex-row items-center">
            <Text className="text-gray-600 w-8">{idx + 1}.</Text>
            <TextInput
              className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
              keyboardType="numeric"
              value={set.reps}
              onChangeText={(v) => updateSet(idx, "reps", v)}
              placeholder="Reps"
            />
            <Text className="text-gray-600 w-12">reps</Text>
            {sets.length > 1 && (
              <Pressable onPress={() => removeSet(idx)} className="ml-2">
                <Text className="text-red-600 text-lg">×</Text>
              </Pressable>
            )}
          </View>
          {showDuration && (
            <View className="flex-row items-center mt-2 ml-8">
              <TextInput
                className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
                keyboardType="numeric"
                value={set.duration || ""}
                onChangeText={(v) => updateSet(idx, "duration", v)}
                placeholder="Hold time (seconds)"
              />
              <Text className="text-gray-600 w-12 text-xs">sec</Text>
            </View>
          )}
        </View>
      ))}
      <Pressable onPress={addSet} className="bg-gray-200 rounded-lg px-4 py-2 mt-2">
        <Text className="text-gray-800 text-center">+ Add Set</Text>
      </Pressable>
    </View>
  );
}