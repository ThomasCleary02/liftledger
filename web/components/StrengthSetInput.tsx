"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { usePreferences } from "../lib/hooks/usePreferences";
import { formatWeightInput } from "../lib/utils/units";
import { formatPlatePlan, looksLikeBarbell, platesForBar } from "@liftledger/shared";

export interface StrengthSet {
  reps: string;
  weight: string;
  warmup?: boolean;
}

interface StrengthSetInputProps {
  sets: StrengthSet[];
  onSetsChange: (sets: StrengthSet[]) => void;
  onAddedSet?: () => void;
  exerciseName?: string;
}

const sanitizeValue = (field: keyof StrengthSet, value: string) => {
  if (value === "") return "";

  if (field === "reps") {
    return value.replace(/\D/g, "");
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

export default function StrengthSetInput({ sets, onSetsChange, onAddedSet, exerciseName }: StrengthSetInputProps) {
  const { units } = usePreferences();
  const weightUnit = units === "metric" ? "kg" : "lb";

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    onSetsChange([
      ...sets,
      lastSet
        ? { ...lastSet, warmup: false }
        : { reps: "10", weight: formatWeightInput(135, units), warmup: false },
    ]);
    onAddedSet?.();
  };

  const removeSet = (idx: number) => {
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof StrengthSet, value: string | boolean) => {
    if (field === "warmup") {
      onSetsChange(sets.map((s, i) => (i === idx ? { ...s, warmup: Boolean(value) } : s)));
      return;
    }
    const sanitized = sanitizeValue(field, String(value));
    onSetsChange(sets.map((s, i) => (i === idx ? { ...s, [field]: sanitized } : s)));
  };

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700">Sets</label>

      {sets.map((set, idx) => {
        const weightNum = Number(set.weight);
        const plan =
          looksLikeBarbell(exerciseName) && !set.warmup && Number.isFinite(weightNum) && weightNum > 0
            ? platesForBar(weightNum, weightUnit)
            : null;
        return (
          <div key={idx} className="mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium text-gray-500">{idx + 1}.</span>
              <button
                type="button"
                onClick={() => updateSet(idx, "warmup", !set.warmup)}
                className={`min-h-[48px] rounded-lg px-2 text-xs font-semibold ${
                  set.warmup ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"
                }`}
                aria-pressed={Boolean(set.warmup)}
                aria-label={set.warmup ? "Warmup set on" : "Mark as warmup"}
                title={set.warmup ? "Warmup (excluded from volume and PRs)" : "Mark as warmup"}
              >
                W
              </button>
              <input
                type="text"
                inputMode="numeric"
                className="min-h-[48px] w-16 flex-none rounded-lg bg-gray-100 px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
                value={set.reps}
                onChange={(e) => updateSet(idx, "reps", e.target.value)}
                placeholder="Reps"
                aria-label={`Set ${idx + 1} reps`}
              />
              <span className="text-gray-400">×</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  className="min-h-[48px] w-full rounded-lg bg-gray-100 px-3 py-3 pr-16 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
                  value={set.weight}
                  onChange={(e) => updateSet(idx, "weight", e.target.value)}
                  placeholder={`Weight (${weightUnit})`}
                  aria-label={`Set ${idx + 1} weight`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                  {weightUnit}
                </span>
              </div>
              {sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(idx)}
                  className="flex-none rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Remove set ${idx + 1}`}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {plan && (
              <p className="ml-8 mt-1 text-xs text-gray-500">{formatPlatePlan(plan, weightUnit)}</p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSet}
        className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>
    </div>
  );
}
