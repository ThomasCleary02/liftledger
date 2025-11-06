


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

export default function CardioInput({ data, onDataChange }: CardioInputProps) {
  const { preferences } = usePreferences();
  const distanceUnit = preferences.units === "metric" ? "km" : "mi";

  return (
    <div>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Duration</label>
        <div className="flex items-center">
          <input
            type="number"
            className="flex-1 rounded-lg bg-gray-100 px-3 py-3 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
            value={data.duration}
            onChange={(e) => onDataChange({ ...data, duration: e.target.value })}
            placeholder="Minutes (e.g., 30)"
            aria-label="Duration in minutes"
          />
          <span className="ml-3 w-20 font-medium text-gray-600">minutes</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Distance (optional)</label>
        <div className="flex items-center">
          <input
            type="number"
            className="flex-1 rounded-lg bg-gray-100 px-3 py-3 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-black"
            value={data.distance}
            onChange={(e) => onDataChange({ ...data, distance: e.target.value })}
            placeholder={distanceUnit === "km" ? "Kilometers" : "Miles"}
            aria-label="Distance"
          />
          <span className="ml-3 w-20 font-medium text-gray-600">{distanceUnit}</span>
        </div>
      </div>
    </div>
  );
}