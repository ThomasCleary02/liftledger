"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plus, X, Timer } from "lucide-react";
import { formatHoldClock, isHoldFocusedExercise } from "@liftledger/shared";
import { usePreferences } from "../lib/hooks/usePreferences";
import { getWeightUnit } from "../lib/utils/units";

export interface CalisthenicsSet {
  reps: string;
  duration?: string;
  addedWeight?: string;
}

interface CalisthenicsSetInputProps {
  sets: CalisthenicsSet[];
  onSetsChange: (sets: CalisthenicsSet[]) => void;
  /** When true, always show hold fields. Otherwise only if a set already has duration, hold-focused name, or user adds hold. */
  showDuration?: boolean;
  exerciseName?: string;
  onAddedSet?: (sets: CalisthenicsSet[]) => void;
}

const sanitizeValue = (value: string) => value.replace(/\D/g, "");
const sanitizeDecimal = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return `${parts[0]}.${parts.slice(1).join("")}`;
  return cleaned;
};

export default function CalisthenicsSetInput({
  sets,
  onSetsChange,
  showDuration = false,
  exerciseName,
  onAddedSet,
}: CalisthenicsSetInputProps) {
  const { units } = usePreferences();
  const weightUnit = getWeightUnit(units);
  const holdFocused = isHoldFocusedExercise(exerciseName || "");
  const hasExistingHold = sets.some((s) => Boolean(s.duration && String(s.duration).trim()));
  const [holdOpen, setHoldOpen] = useState(hasExistingHold || holdFocused || showDuration);
  const showHold = showDuration || holdOpen || hasExistingHold || holdFocused;

  const [timingIdx, setTimingIdx] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (timingIdx == null) return;
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    const id = window.setInterval(() => {
      const started = startedAtRef.current;
      if (started == null) return;
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [timingIdx]);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const blank = holdFocused ? { reps: "1", duration: "" } : { reps: "10" };
    const next = [...sets, lastSet ? { ...lastSet } : blank];
    onSetsChange(next);
    onAddedSet?.(next);
  };

  const removeSet = (idx: number) => {
    if (timingIdx === idx) {
      setTimingIdx(null);
      startedAtRef.current = null;
    } else if (timingIdx != null && timingIdx > idx) {
      setTimingIdx(timingIdx - 1);
    }
    onSetsChange(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof CalisthenicsSet, value: string) => {
    const sanitized =
      field === "addedWeight" ? sanitizeDecimal(value) : field === "reps" || field === "duration" ? sanitizeValue(value) : value;
    onSetsChange(sets.map((s, i) => (i === idx ? { ...s, [field]: sanitized } : s)));
  };

  const commitElapsed = (idx: number) => {
    const started = startedAtRef.current;
    const seconds = started != null ? Math.max(1, Math.floor((Date.now() - started) / 1000)) : Math.max(1, elapsedSec);
    updateSet(idx, "duration", String(seconds));
  };

  const stopTimer = () => {
    if (timingIdx == null) return;
    commitElapsed(timingIdx);
    setTimingIdx(null);
    startedAtRef.current = null;
    setElapsedSec(0);
  };

  const startTimer = (idx: number) => {
    if (timingIdx != null && timingIdx !== idx) {
      commitElapsed(timingIdx);
    }
    setTimingIdx(idx);
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
              className="mr-2 min-h-[48px] flex-1 rounded-lg bg-gray-100 px-3 py-3 text-base tabular-nums text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand"
              value={set.reps}
              onChange={(e) => updateSet(idx, "reps", e.target.value)}
              placeholder={holdFocused ? "1" : "Reps"}
              enterKeyHint="next"
              aria-label={`Set ${idx + 1} reps`}
            />
            <span className="w-12 text-gray-600">reps</span>
            <input
              type="text"
              inputMode="decimal"
              className="ml-2 min-h-[48px] w-20 rounded-lg bg-gray-100 px-3 py-3 text-base tabular-nums text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand"
              value={set.addedWeight || ""}
              onChange={(e) => updateSet(idx, "addedWeight", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSet();
                }
              }}
              placeholder={`+${weightUnit}`}
              enterKeyHint="done"
              aria-label={`Set ${idx + 1} added weight in ${weightUnit}`}
            />
            {sets.length > 1 && (
              <button
                onClick={() => removeSet(idx)}
                type="button"
                className="ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-red-600 transition-colors hover:text-red-700"
                aria-label={`Remove set ${idx + 1}`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {showHold && (
            <div className="ml-8 mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  className="min-h-[48px] flex-1 rounded-lg bg-gray-100 px-3 py-3 text-base tabular-nums text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  value={set.duration || ""}
                  onChange={(e) => updateSet(idx, "duration", e.target.value)}
                  placeholder="Hold (seconds)"
                  aria-label={`Set ${idx + 1} hold time in seconds`}
                />
                <span className="w-10 shrink-0 text-xs text-gray-600">sec</span>
                {timingIdx === idx ? (
                  <button
                    type="button"
                    onClick={stopTimer}
                    className="min-h-[48px] shrink-0 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white"
                    aria-label={`Stop hold timer for set ${idx + 1}`}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startTimer(idx)}
                    className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
                    aria-label={`Start hold timer for set ${idx + 1}`}
                  >
                    <Timer className="h-4 w-4" />
                    Start
                  </button>
                )}
              </div>
              {timingIdx === idx ? (
                <p className="font-mono text-2xl font-bold tabular-nums text-gray-900" aria-live="polite">
                  {formatHoldClock(elapsedSec)}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ))}
      {!showHold ? (
        <button
          type="button"
          onClick={() => setHoldOpen(true)}
          className="mt-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          Add hold time
        </button>
      ) : null}
      <button
        type="button"
        onClick={addSet}
        className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 text-gray-800 transition-colors hover:bg-gray-300"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>
    </div>
  );
}
