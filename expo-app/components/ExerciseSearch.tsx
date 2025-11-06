import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { searchExercisesRemote } from "../lib/firestore/exercises";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  onSelect: (exerciseId: string, name: string, modality: "strength" | "cardio" | "calisthenics") => void;
  placeholder?: string;
  maxResults?: number;
};

const getModalityConfig = (modality: string) => {
  switch (modality) {
    case "strength":
      return { icon: "barbell", color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "cardio":
      return { icon: "heart", color: "bg-red-100 text-red-700 border-red-200" };
    case "calisthenics":
      return { icon: "body", color: "bg-green-100 text-green-700 border-green-200" };
    default:
      return { icon: "fitness", color: "bg-gray-100 text-gray-700 border-gray-200" };
  }
};

export default function ExerciseSearch({ onSelect, placeholder = "Search exercises...", maxResults = 8 }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string; modality: string; muscleGroup?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    
    const search = async () => {
      if (!query.trim()) {
        if (active) setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const r = await searchExercisesRemote(query, undefined, maxResults);
        if (active) {
          setResults(r.map(x => ({ 
            id: x.id, 
            name: x.name, 
            modality: x.modality,
            muscleGroup: x.muscleGroup 
          })));
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    const t = setTimeout(search, 300);
    return () => { 
      active = false; 
      clearTimeout(t); 
    };
  }, [query, maxResults]);

  return (
    <View>
      <View className="relative mb-3">
        <Ionicons 
          name="search" 
          size={20} 
          color="#9ca3af" 
          style={{ position: "absolute", left: 16, top: 14, zIndex: 1 }}
        />
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-12 py-3.5 text-base"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>
      {loading ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : (
        <>
          {results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const config = getModalityConfig(item.modality);
                return (
                  <Pressable
                    onPress={() => { onSelect(item.id, item.name, item.modality as any); setQuery(""); }}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-3 active:bg-gray-50"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="font-semibold text-base text-gray-900 mb-1">{item.name}</Text>
                        {item.muscleGroup && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="location" size={12} color="#6b7280" />
                            <Text className="text-gray-500 text-xs ml-1 capitalize">
                              {item.muscleGroup.replace(/_/g, " ")}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className={`flex-row items-center px-2.5 py-1 rounded-full border ${config.color}`}>
                        <Ionicons name={config.icon as any} size={12} color="currentColor" />
                        <Text className="text-xs font-semibold ml-1 capitalize">{item.modality}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }}
              scrollEnabled={false}
            />
          ) : (
            query.trim().length > 0 && (
              <View className="py-6 items-center">
                <Ionicons name="search-outline" size={32} color="#d1d5db" />
                <Text className="text-gray-500 mt-2">No exercises found</Text>
              </View>
            )
          )}
        </>
      )}
    </View>
  );
}