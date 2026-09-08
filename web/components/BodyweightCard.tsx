"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Scale } from "lucide-react";
import type { UnitSystem } from "@liftledger/shared";
import { formatWeight, formatWeightInput, getWeightUnit, toStoredWeight } from "../lib/utils/units";

type Props = {
  valueLbs?: number;
  units: UnitSystem;
  disabled?: boolean;
  onSave: (bodyweightLbs: number | null) => Promise<void>;
};

export function BodyweightCard({ valueLbs, units, disabled, onSave }: Props) {
  const unit = getWeightUnit(units);
  const [confirmedLbs, setConfirmedLbs] = useState<number | undefined>(valueLbs);
  const [draft, setDraft] = useState(() => (valueLbs != null ? formatWeightInput(valueLbs, units) : ""));
  const draftRef = useRef(draft);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(() => valueLbs == null);
  const [error, setError] = useState<string | null>(null);

  draftRef.current = draft;

  // Sync when parent loads/updates a stored weigh-in. Do not reset on undefined —
  // that races optimistic save before the day state catches up. Date changes remount via key.
  useEffect(() => {
    if (valueLbs == null) return;
    setConfirmedLbs(valueLbs);
    setDraft(formatWeightInput(valueLbs, units));
    draftRef.current = formatWeightInput(valueLbs, units);
    setEditing(false);
    setError(null);
  }, [valueLbs, units]);

  const persist = async () => {
    if (disabled || saving) return;
    const trimmed = draftRef.current.trim();
    if (!trimmed) {
      if (confirmedLbs == null) {
        setEditing(true);
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await onSave(null);
        setConfirmedLbs(undefined);
        setDraft("");
        draftRef.current = "";
        setEditing(true);
      } catch {
        setError("Could not clear bodyweight");
      } finally {
        setSaving(false);
      }
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 800) {
      setError(`Enter a valid weight in ${unit}`);
      return;
    }

    const stored = toStoredWeight(parsed, units);
    if (confirmedLbs != null && Math.abs(stored - confirmedLbs) < 0.05) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(stored);
      setConfirmedLbs(stored);
      setEditing(false);
    } catch {
      setError("Could not save bodyweight");
    } finally {
      setSaving(false);
    }
  };

  if (confirmedLbs != null && !editing) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 py-2">
        <p className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
          <Scale className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          <span className="font-medium text-gray-900">Bodyweight</span>
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <span className="font-mono tabular-nums text-gray-700">{formatWeight(confirmedLbs, units)}</span>
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraft(formatWeightInput(confirmedLbs, units));
            draftRef.current = formatWeightInput(confirmedLbs, units);
            setEditing(true);
          }}
          className="flex min-h-[44px] items-center gap-1.5 px-2 text-sm font-semibold text-brand"
          aria-label="Edit bodyweight"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale className="h-4 w-4 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Bodyweight</h2>
      </div>
      <p className="mb-3 text-sm text-gray-500">One weigh-in for this day. Save to collapse.</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={units === "metric" ? "0.1" : "1"}
            value={draft}
            disabled={disabled || saving}
            autoFocus={confirmedLbs != null}
            onChange={(event) => {
              setDraft(event.target.value);
              draftRef.current = event.target.value;
              setError(null);
            }}
            onBlur={() => void persist()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape" && confirmedLbs != null) {
                const next = formatWeightInput(confirmedLbs, units);
                setDraft(next);
                draftRef.current = next;
                setEditing(false);
                setError(null);
              }
            }}
            aria-label={`Bodyweight in ${unit}`}
            placeholder={units === "metric" ? "kg" : "lb"}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
          <span className="shrink-0 text-sm font-medium text-gray-500">{unit}</span>
        </div>
        <button
          type="button"
          disabled={disabled || saving || !draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void persist()}
          className="min-h-[48px] w-full shrink-0 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-fg disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger-fg">{error}</p> : null}
      {confirmedLbs != null ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            const next = formatWeightInput(confirmedLbs, units);
            setDraft(next);
            draftRef.current = next;
            setEditing(false);
            setError(null);
          }}
          className="mt-2 text-sm font-semibold text-gray-600"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
