"use client";

import { Trophy, Flame } from "lucide-react";
import { FullScreenSheet } from "./FullScreenSheet";
import { Avatar } from "./Avatar";
import type { PublicAchievements, PublicPR } from "@liftledger/shared";
import { formatWeight, formatDistance, formatCardioDuration, formatPace } from "../lib/utils/units";
import type { UnitSystem } from "@liftledger/shared";

function formatPrValue(pr: PublicPR, units: UnitSystem): string {
  if (pr.prType === "maxWeight") return formatWeight(pr.value, units);
  if (pr.prType === "maxVolume") return formatWeight(pr.value, units);
  if (pr.prType === "maxDistance") return formatDistance(pr.value, units);
  if (pr.prType === "maxDuration") return formatCardioDuration(pr.value);
  if (pr.prType === "bestPace") return formatPace(pr.value, units);
  if (pr.prType === "maxReps") return `${pr.value} reps`;
  return String(pr.value);
}

function prLabel(prType: PublicPR["prType"]): string {
  if (prType === "maxWeight") return "Heaviest";
  if (prType === "maxVolume") return "Best set volume";
  if (prType === "maxDistance") return "Farthest";
  if (prType === "maxDuration") return "Longest";
  if (prType === "bestPace") return "Best pace";
  return "Most reps";
}

export function ProfileSheet({
  open,
  username,
  photoURL,
  achievements,
  units,
  onClose,
}: {
  open: boolean;
  username: string | null;
  photoURL: string | null;
  achievements: PublicAchievements | null;
  units: UnitSystem;
  onClose: () => void;
}) {
  const showStreak =
    achievements && (achievements.currentStreak != null || achievements.longestStreak != null);
  const prs = achievements?.prs ?? [];

  return (
    <FullScreenSheet open={open} title={username || "Friend"} onClose={onClose} footer={null}>
      <div className="flex flex-col items-center pb-4">
        <Avatar name={username} photoURL={photoURL} size={80} />
        <p className="mt-3 text-xl font-semibold text-gray-900">{username || "Friend"}</p>
      </div>

      {!achievements ? (
        <p className="py-8 text-center text-sm text-gray-500">
          This person has not shared streaks or PRs yet.
        </p>
      ) : (
        <div className="space-y-4">
          {showStreak && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Flame className="h-4 w-4 text-brand" />
                Streaks
              </div>
              <div className="flex gap-6">
                {achievements.currentStreak != null && (
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-gray-900">{achievements.currentStreak}</p>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                )}
                {achievements.longestStreak != null && (
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-gray-900">{achievements.longestStreak}</p>
                    <p className="text-xs text-gray-500">Longest</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {prs.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                <Trophy className="h-4 w-4 text-brand" />
                PRs they chose to show
              </div>
              <ul className="divide-y divide-gray-100">
                {prs.map((pr) => (
                  <li key={pr.key} className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{pr.exerciseName}</p>
                    <p className="text-sm text-gray-500">
                      {prLabel(pr.prType)} · {formatPrValue(pr, units)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </FullScreenSheet>
  );
}
