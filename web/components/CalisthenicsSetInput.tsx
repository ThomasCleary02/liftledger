"use client";

import React from "react";
import { Plus, X } from "lucide-react";

export interface CalisthenicsSet {
  reps: string;
  duration?: string;
}

interface CalisthenicsSetInputProps {
  sets: CalisthenicsSet[];
  onSetsChange: (sets: CalisthenicsSet[]) => void;
  showDuration?: boolean;
}

const sanitizeValue = (value: string) => value.replace(/\D/g, "");

export default function CalisthenicsSetInput({
  sets,
  onSetsChange,
  showDuration = false,
}: CalisthenicsSetInputProps) {
  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    onSetsChange([...sets, lastSet ? { ...lastSet } : { reps: "10" }]);
  };

  const removeSet = (idx: number) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof CalisthenicsSet, value: string) => {
    const sanitized = field === "reps" || field === "duration" ? sanitizeValue(value) : value;
    onSetsChange(sets.map((s, i) => (i === idx ? { ...s, [field]: sanitized } : s)));
  };

  return (
    <div>
      <p className="mb-2 font-medium text-gray-700">Sets</p>
      {sets.map((set, idx) => (
        <div key={idx} className="mb-2">
          <div className="flex items-center">
            <span className="w-8 text-gray-600">{idx + 1}.</span>
            <input
              type="text"
              inputMode="numeric"
              className="mr-2 flex-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-black"
              value={set.reps}
              onChange={(e) => updateSet(idx, "reps", e.target.value)}
              placeholder="Reps"
            />
            <span className="w-12 text-gray-600">reps</span>
            {sets.length > 1 && (
              <button
                onClick={() => removeSet(idx)}
                className="ml-2 text-red-600 transition-colors hover:text-red-700"
                aria-label={`Remove set ${idx + 1}`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {showDuration && (
            <div className="ml-8 mt-2 flex items-center">
              <input
                type="text"
                inputMode="numeric"
                className="mr-2 flex-1 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-black"
                value={set.duration || ""}
                onChange={(e) => updateSet(idx, "duration", e.target.value)}
                placeholder="Hold time (seconds)"
              />
              <span className="w-12 text-xs text-gray-600">sec</span>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addSet}
        className="mt-2 flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>
    </div>
  );
}