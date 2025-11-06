"use client";

import { useEffect, useState, useRef } from "react";
import { searchExercisesRemote } from "../lib/firestore/exercises";
import { Search, Dumbbell, Heart, Activity } from "lucide-react";

type Props = {
  onSelect: (
    exerciseId: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => void;
  placeholder?: string;
  maxResults?: number;
};

const getModalityConfig = (modality: string) => {
  switch (modality) {
    case "strength":
      return { icon: Dumbbell, color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "cardio":
      return { icon: Heart, color: "bg-red-100 text-red-700 border-red-200" };
    case "calisthenics":
      return { icon: Activity, color: "bg-green-100 text-green-700 border-green-200" };
    default:
      return { icon: Activity, color: "bg-gray-100 text-gray-700 border-gray-200" };
  }
};

export default function ExerciseSearch({
  onSelect,
  placeholder = "Search exercises...",
  maxResults = 8,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; modality: string; muscleGroup?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    const search = async () => {
      if (!query.trim()) {
        if (active) {
          setResults([]);
          setSelectedIndex(-1);
        }
        return;
      }

      setLoading(true);
      try {
        const r = await searchExercisesRemote(query, undefined, maxResults);
        if (active) {
          setResults(
            r.map((x) => ({
              id: x.id,
              name: x.name,
              modality: x.modality,
              muscleGroup: x.muscleGroup,
            }))
          );
          setSelectedIndex(-1);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const item = results[selectedIndex];
      onSelect(item.id, item.name, item.modality as any);
      setQuery("");
      setSelectedIndex(-1);
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-white px-12 py-3.5 text-base outline-none transition-all placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoComplete="off"
          aria-label="Search exercises"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-black"></div>
        </div>
      ) : (
        <>
          {query.trim() && results.length === 0 && !loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No exercises found</p>
              <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
            </div>
          )}
          {results.length > 0 && (
            <div ref={resultsRef} className="space-y-3">
              {results.map((item, idx) => {
                const config = getModalityConfig(item.modality);
                const Icon = config.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id, item.name, item.modality as any);
                      setQuery("");
                      setSelectedIndex(-1);
                    }}
                    className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? "border-black bg-gray-50 ring-2 ring-black"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-center">
                        <div
                          className={`mr-3 rounded-full border p-2 ${config.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.muscleGroup && (
                            <p className="text-sm text-gray-500 capitalize">
                              {item.muscleGroup.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">
                        {item.modality}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
