"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import type { UnitSystem } from "@liftledger/shared";
import { formatWeightInput, getWeightUnit, toStoredWeight } from "../lib/utils/units";

type Props = {
  valueLbs?: number;
  units: UnitSystem;
  disabled?: boolean;
  onSave: (bodyweightLbs: number | null) => Promise<void>;
};

export function BodyweightCard({ valueLbs, units, disabled, onSave }: Props) {
  const unit = getWeightUnit(units);
  const [draft, setDraft] = useState(() => (valueLbs ? formatWeightInput(valueLbs, units) : ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(valueLbs ? formatWeightInput(valueLbs, units) : "");
  }, [valueLbs, units]);

  const persist = async () => {
    if (disabled || saving) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      if (valueLbs == null) return;
      setSaving(true);
      try {
        await onSave(null);
      } finally {
        setSaving(false);
      }
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 800) return;
    const stored = toStoredWeight(parsed, units);
    if (valueLbs != null && Math.abs(stored - valueLbs) < 0.05) return;
    setSaving(true);
    try {
      await onSave(stored);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale className="h-4 w-4 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Bodyweight</h2>
      </div>
      <p className="mb-3 text-sm text-gray-500">One weigh-in for this day.</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={units === "metric" ? "0.1" : "1"}
          value={draft}
          disabled={disabled || saving}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void persist()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          aria-label={`Bodyweight in ${unit}`}
          placeholder={units === "metric" ? "kg" : "lb"}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        />
        <span className="shrink-0 text-sm font-medium text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
