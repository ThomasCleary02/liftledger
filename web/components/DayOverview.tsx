"use client";

import { useMemo, useState } from "react";
import type { Day } from "@liftledger/shared/firestore/days";
import {
  calculateTotalVolumeFromDays,
  calculateTotalCardioDurationFromDays,
  calculateTotalCalisthenicsRepsFromDays,
} from "@liftledger/shared";
import { formatWeight, formatCardioDuration } from "../lib/utils/units";
import { usePreferences } from "../lib/hooks/usePreferences";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DayOverview({ day }: { day: Day | null }) {
  const { units } = usePreferences();
  const [open, setOpen] = useState(true);

  const summary = useMemo(() => {
    if (!day || day.isRestDay) return null;
    const days = [day];
    const volume = calculateTotalVolumeFromDays(days);
    const cardioSec = calculateTotalCardioDurationFromDays(days);
    const reps = calculateTotalCalisthenicsRepsFromDays(days);
    const exerciseCount = day.exercises?.length || 0;
    const steps = (day.exercises || []).reduce((sum, ex) => {
      const n = ex.cardioData?.steps;
      return sum + (typeof n === "number" && n > 0 ? n : 0);
    }, 0);
    if (exerciseCount === 0 && volume <= 0 && cardioSec <= 0 && reps <= 0 && steps <= 0) {
      return null;
    }
    return { volume, cardioSec, reps, exerciseCount, steps };
  }, [day]);

  if (!summary) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900">Day overview</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {open ? (
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-4 py-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Exercises</p>
            <p className="text-lg font-bold tabular-nums text-gray-900">{summary.exerciseCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Volume</p>
            <p className="text-lg font-bold tabular-nums text-gray-900">
              {summary.volume > 0 ? formatWeight(summary.volume, units) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cardio</p>
            <p className="text-lg font-bold tabular-nums text-gray-900">
              {summary.cardioSec > 0 ? formatCardioDuration(summary.cardioSec) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{summary.steps > 0 ? "Steps" : "Calisthenics"}</p>
            <p className="text-lg font-bold tabular-nums text-gray-900">
              {summary.steps > 0
                ? summary.steps.toLocaleString()
                : summary.reps > 0
                  ? `${summary.reps.toLocaleString()} reps`
                  : "—"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
