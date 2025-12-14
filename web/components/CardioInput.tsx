"use client";

import React from "react";
import { usePreferences } from "../lib/hooks/usePreferences";

export interface CardioData {
  duration: string;
  distance: string;
}

interface CardioInputProps {
  data: CardioData;
  onDataChange: (data: CardioData) => void;
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

export default function CardioInput({ data, onDataChange }: CardioInputProps) {
  const { units } = usePreferences();
  const distanceUnit = units === "metric" ? "km" : "mi";

  return (
    <div>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Duration</label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="flex-1 rounded-lg bg-gray-100 px-3 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
            value={data.duration}
            onChange={(e) =>
              onDataChange({ ...data, duration: sanitizeValue(e.target.value, false) })
            }
            placeholder="Minutes (e.g., 30)"
            aria-label="Duration in minutes"
          />
          <span className="ml-3 w-20 font-medium text-gray-600">minutes</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Distance (optional)
        </label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            className="flex-1 rounded-lg bg-gray-100 px-3 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
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