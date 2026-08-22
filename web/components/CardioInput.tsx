"use client";

import React from "react";
import { usePreferences } from "../lib/hooks/usePreferences";
import {
  CARDIO_ACTIVITY_TYPES,
  CARDIO_ACTIVITY_LABELS,
  type CardioActivityType,
} from "@liftledger/shared";

export interface CardioData {
  duration: string;
  distance: string;
}

interface CardioInputProps {
  data: CardioData;
  onDataChange: (data: CardioData) => void;
  activityType?: CardioActivityType;
  onActivityTypeChange?: (type: CardioActivityType) => void;
}

const sanitizeValue = (value: string, allowDecimal: boolean) => {
  if (value === "") return "";
  const pattern = allowDecimal ? /[^0-9.]/g : /\D/g;
  const cleaned = value.replace(pattern, "");
  if (!allowDecimal) return cleaned;

  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return cleaned;
};

export default function CardioInput({
  data,
  onDataChange,
  activityType = "other",
  onActivityTypeChange,
}: CardioInputProps) {
  const { units } = usePreferences();
  const distanceUnit = units === "metric" ? "km" : "mi";
  const showDistancePrompt = activityType !== "other";

  return (
    <div>
      {onActivityTypeChange && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Type</p>
          <div className="flex flex-wrap gap-2">
            {CARDIO_ACTIVITY_TYPES.map((type) => {
              const selected = type === activityType;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onActivityTypeChange(type)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-brand text-brand-fg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {CARDIO_ACTIVITY_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Time</label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="min-h-[48px] flex-1 rounded-lg bg-gray-100 px-3 py-3 text-base tabular-nums text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand"
            value={data.duration}
            onChange={(e) =>
              onDataChange({ ...data, duration: sanitizeValue(e.target.value, false) })
            }
            placeholder="30"
            aria-label="Duration in minutes"
          />
          <span className="ml-3 w-20 font-medium text-gray-600">minutes</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {showDistancePrompt ? "Distance" : "Distance (optional)"}
        </label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            className="min-h-[48px] flex-1 rounded-lg bg-gray-100 px-3 py-3 text-base tabular-nums text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand"
            value={data.distance}
            onChange={(e) =>
              onDataChange({ ...data, distance: sanitizeValue(e.target.value, true) })
            }
            placeholder={distanceUnit === "km" ? "Kilometers" : "Miles"}
            aria-label="Distance"
          />
          <span className="ml-3 w-20 font-medium text-gray-600">{distanceUnit}</span>
        </div>
      </div>
    </div>
  );
}
