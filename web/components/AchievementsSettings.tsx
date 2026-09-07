"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { FullScreenSheet } from "./FullScreenSheet";
import {
  DEFAULT_ACHIEVEMENT_SHARE,
  findAllPRs,
  prAchievementKey,
  type AchievementShareSettings,
} from "@liftledger/shared";
import { listDays } from "../lib/firestore/days";
import { accountService } from "../lib/firebase";
import { publishPublicAchievements } from "../lib/publishAchievements";
import { toast } from "../lib/toast";
import { logger } from "../lib/logger";
import { formatWeight } from "../lib/utils/units";
import { usePreferences } from "../lib/hooks/usePreferences";

export function AchievementsSettings({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { units } = usePreferences();
  const [share, setShare] = useState<AchievementShareSettings>({ ...DEFAULT_ACHIEVEMENT_SHARE });
  const [options, setOptions] = useState<{ key: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [current, days] = await Promise.all([
          accountService.getAchievementShare(),
          listDays({ limit: 250, order: "desc" }),
        ]);
        if (cancelled) return;
        setShare(current);
        const prs = findAllPRs(days).sort((a, b) => b.date.getTime() - a.date.getTime());
        setOptions(
          prs.slice(0, 24).map((pr) => ({
            key: prAchievementKey(pr),
            label:
              pr.prType === "maxWeight"
                ? `${pr.exerciseName} · ${formatWeight(pr.value, units)}`
                : `${pr.exerciseName} · ${pr.prType}`,
          }))
        );
      } catch (error) {
        logger.error("Failed to load achievements", error);
        toast.error("Could not load PRs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, units]);

  const persist = async (next: AchievementShareSettings) => {
    const stored = next.enabled ? next : { ...DEFAULT_ACHIEVEMENT_SHARE };
    setShare(stored);
    setSaving(true);
    try {
      if (!stored.enabled) {
        await accountService.setAchievementShare(stored, null);
      } else {
        await publishPublicAchievements(stored);
      }
      toast.success(next.enabled ? "Profile badges updated" : "Profile badges hidden");
    } catch (error) {
      logger.error("Failed to save achievements", error);
      toast.error("Could not save profile badges");
    } finally {
      setSaving(false);
    }
  };

  const togglePin = (key: string) => {
    const pinned = share.pinnedKeys.includes(key)
      ? share.pinnedKeys.filter((item) => item !== key)
      : [...share.pinnedKeys, key].slice(0, 5);
    void persist({ ...share, pinnedKeys: pinned });
  };

  return (
    <FullScreenSheet open={open} title="Profile badges" onClose={onClose}>
      <p className="mb-4 text-sm text-gray-600">
        Friends see only what you pin. Off clears the public snapshot.
      </p>
      <button
        type="button"
        disabled={saving}
        onClick={() => void persist({ ...share, enabled: !share.enabled })}
        className={`mb-3 flex w-full min-h-[48px] items-center justify-between rounded-xl border-2 px-4 py-3 ${
          share.enabled ? "border-brand bg-brand/10" : "border-gray-200 bg-gray-50"
        }`}
      >
        <span className="font-semibold text-gray-900">Share on my profile</span>
        <span className="text-sm text-gray-500">{share.enabled ? "On" : "Off"}</span>
      </button>
      {share.enabled && (
        <>
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist({ ...share, showStreak: !share.showStreak })}
            className={`mb-2 flex w-full min-h-[48px] items-center justify-between rounded-xl border px-4 py-3 ${
              share.showStreak ? "border-brand bg-brand/10" : "border-gray-200"
            }`}
          >
            <span className="font-medium text-gray-900">Current and longest streak</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist({ ...share, showPRs: !share.showPRs })}
            className={`mb-4 flex w-full min-h-[48px] items-center justify-between rounded-xl border px-4 py-3 ${
              share.showPRs ? "border-brand bg-brand/10" : "border-gray-200"
            }`}
          >
            <span className="font-medium text-gray-900">Personal records</span>
          </button>
          {share.showPRs && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Pin up to 5 (empty = five newest)</p>
              {loading ? (
                <p className="py-6 text-center text-sm text-gray-500">Loading PRs…</p>
              ) : options.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">Log a few lifts to pin PRs.</p>
              ) : (
                <div className="space-y-2">
                  {options.map((option) => {
                    const on = share.pinnedKeys.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={saving}
                        onClick={() => togglePin(option.key)}
                        className={`flex w-full min-h-[48px] items-center gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                          on ? "border-brand bg-brand/10" : "border-gray-200 bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            on ? "border-brand bg-brand" : "border-gray-300"
                          }`}
                        >
                          {on && <Check className="h-4 w-4 text-white" />}
                        </span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </FullScreenSheet>
  );
}
