"use client";

import React from "react";
import { Plus, X, Copy } from "lucide-react";
import { usePreferences } from "../lib/hooks/usePreferences";

export interface StrengthSet {
  reps: string;
  weight: string;
}

interface StrengthSetInputProps {
  sets: StrengthSet[];
  onSetsChange: (sets: StrengthSet[]) => void;
}

export default function StrengthSetInput({ sets, onSetsChange }: StrengthSetInputProps) {
  const { preferences } = usePreferences();
  const weightUnit = preferences.units === "metric" ? "kg" : "lb";

  const sanitizeValue = (field: keyof StrengthSet, value: string) => {
    if (value === "") return "";
    
    if (field === "reps") {
      return value.replace(/\D/g, ""); // digits only
    }
    
    if (field === "weight") {
      const cleaned = value.replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        return `${parts[0]}.${parts.slice(1).join("")}`;
      }
      return cleaned;
    }
  
    return value;
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    onSetsChange([...sets, lastSet ? { ...lastSet } : { reps: "10", weight: "135" }]);
  };

  const copyLastSet = () => {
    if (sets.length === 0) return;
    const lastSet = sets[sets.length - 1];
    onSetsChange([...sets, { ...lastSet }]);
  };

  const removeSet = (idx: number) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof StrengthSet, value: string) => {
    const sanitizedValue = sanitizeValue(field, value);
    onSetsChange(sets.map((s, i) => (i === idx ? { ...s, [field]: sanitizedValue } : s)));
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Sets</label>
        {sets.length > 0 && (
          <button
            type="button"
            onClick={copyLastSet}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Copy last set"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Last</span>
          </button>
        )}
      </div>
      {sets.map((set, idx) => (
        <div key={idx} className="mb-2 flex items-center gap-2">
          <span className="w-8 text-sm font-medium text-gray-500">{idx + 1}.</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
            value={set.reps}
            onChange={(e) => updateSet(idx, "reps", e.target.value)}
            placeholder="Reps"
            aria-label={`Set ${idx + 1} reps`}
          />
          <span className="mx-1 text-gray-400">×</span>
          <div className="relative flex-1">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="w-full rounded-lg bg-gray-100 px-3 py-2.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
            value={set.weight}
            onChange={(e) => updateSet(idx, "weight", e.target.value)}
            placeholder="Weight"
            aria-label={`Set ${idx + 1} weight`}
          />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{weightUnit}</span>
          </div>
          {sets.length > 1 && (
            <button
              type="button"
              onClick={() => removeSet(idx)}
              className="ml-1 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Remove set ${idx + 1}`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addSet}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>
    </div>
  );
}