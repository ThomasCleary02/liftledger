// components/StrengthSetInput.tsx
import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";

export interface StrengthSet {
  reps: string;
  weight: string;
}

interface StrengthSetInputProps {
  sets: StrengthSet[];
  onSetsChange: (sets: StrengthSet[]) => void;
}

export default function StrengthSetInput({ sets, onSetsChange }: StrengthSetInputProps) {
  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    onSetsChange([...sets, lastSet ? { ...lastSet } : { reps: "10", weight: "135" }]);
  };

  const removeSet = (idx: number) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof StrengthSet, value: string) => {
    onSetsChange(sets.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <View>
      <Text className="font-medium text-gray-700 mb-2">Sets</Text>
      {sets.map((set, idx) => (
        <View key={idx} className="flex-row items-center mb-2">
          <Text className="text-gray-600 w-8">{idx + 1}.</Text>
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
            keyboardType="numeric"
            value={set.reps}
            onChangeText={(v) => updateSet(idx, "reps", v)}
            placeholder="Reps"
          />
          <Text className="mx-2 text-gray-600">×</Text>
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2"
            keyboardType="numeric"
            value={set.weight}
            onChangeText={(v) => updateSet(idx, "weight", v)}
            placeholder="Weight"
          />
          <Text className="text-gray-600 w-8">lb</Text>
          {sets.length > 1 && (
            <Pressable onPress={() => removeSet(idx)} className="ml-2">
              <Text className="text-red-600 text-lg">×</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Pressable onPress={addSet} className="bg-gray-200 rounded-lg px-4 py-2 mt-2">
        <Text className="text-gray-800 text-center">+ Add Set</Text>
      </Pressable>
    </View>
  );
}