"use client";

import React from "react";
import { Timestamp } from "firebase/firestore";
import { Exercise } from "../lib/firestore/workouts";
import { usePreferences } from "../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../lib/utils/units";
import { Dumbbell, Heart, Activity, ChevronRight, List, Repeat } from "lucide-react";

type Props = {
  id: string;
  date: Date | Timestamp;
  exercises: Exercise[];
  totalVolume?: number;
  totalCardioDuration?: number;
  onPress?: () => void;
  onLongPress?: () => void;
};

const getModalityColor = (modality: string) => {
  switch (modality) {
    case "strength": return "bg-blue-100 text-blue-700";
    case "cardio": return "bg-red-100 text-red-700";
    case "calisthenics": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getModalityIcon = (modality: string) => {
  switch (modality) {
    case "strength": return Dumbbell;
    case "cardio": return Heart;
    case "calisthenics": return Activity;
    default: return Activity;
  }
};

export default function WorkoutCard({ 
  id, 
  date, 
  exercises, 
  totalVolume, 
  totalCardioDuration, 
  onPress, 
  onLongPress 
}: Props) {
  const { preferences } = usePreferences();
  const d = (date as any)?.toDate ? (date as Timestamp).toDate() : (date as Date);
  const exerciseCount = exercises?.length ?? 0;
  
  const setCount = exercises?.reduce((sum, ex) => {
    if (ex.modality === "strength" && ex.strengthSets) {
      return sum + ex.strengthSets.length;
    }
    if (ex.modality === "calisthenics" && ex.calisthenicsSets) {
      return sum + ex.calisthenicsSets.length;
    }
    if (ex.modality === "cardio" && ex.cardioData) {
      return sum + 1;
    }
    return sum;
  }, 0) ?? 0;

  // Group exercises by modality
  const modalityCounts = exercises?.reduce((acc, ex) => {
    acc[ex.modality] = (acc[ex.modality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Normalize dates to just year/month/day (remove time components)
    const normalizeDate = (d: Date) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedDate = normalizeDate(date);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);
    
    if (normalizedDate.getTime() === normalizedToday.getTime()) {
      return "Today";
    } else if (normalizedDate.getTime() === normalizedYesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined 
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onPress) onPress();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) onLongPress();
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="mb-4 cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      aria-label={`Workout from ${formatDate(d)}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold text-gray-900">{formatDate(d)}</h3>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex items-center">
              <List className="h-3.5 w-3.5 text-gray-500" />
              <span className="ml-1 text-sm text-gray-600">{exerciseCount} exercises</span>
            </div>
            <div className="flex items-center">
              <Repeat className="h-3.5 w-3.5 text-gray-500" />
              <span className="ml-1 text-sm text-gray-600">{setCount} sets</span>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-gray-50 px-3 py-1">
          <ChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </div>
      </div>

      {/* Modality badges */}
      {Object.keys(modalityCounts).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(modalityCounts).map(([modality, count]) => {
            const Icon = getModalityIcon(modality);
            return (
              <div
                key={modality}
                className={`flex items-center rounded-full px-2.5 py-1 ${getModalityColor(modality)}`}
              >
                <Icon className="h-3 w-3" />
                <span className="ml-1 text-xs font-semibold capitalize">
                  {modality} ({count})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise preview */}
      <p className="mb-3 line-clamp-2 text-sm leading-5 text-gray-700">
        {exercises?.slice(0, 3).map(e => e.name).join(" • ") || "No exercises"}
        {exerciseCount > 3 && "..."}
      </p>

      {/* Stats */}
      {((totalVolume !== undefined && totalVolume !== null && totalVolume > 0) || 
        (totalCardioDuration !== undefined && totalCardioDuration !== null && totalCardioDuration > 0)) ? (
        <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
          {totalVolume !== undefined && totalVolume !== null && totalVolume > 0 && (
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-blue-100 p-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-blue-800" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Volume</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatWeight(totalVolume, preferences.units)}
                </p>
              </div>
            </div>
          )}
          {totalCardioDuration !== undefined && totalCardioDuration !== null && totalCardioDuration > 0 && (
            <div className="flex items-center">
              <div className="mr-2 rounded-full bg-red-100 p-1.5">
                <Heart className="h-3.5 w-3.5 text-red-800" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cardio</p>
                <p className="text-sm font-semibold text-gray-900">
                  {Math.round(totalCardioDuration / 60)} min
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
