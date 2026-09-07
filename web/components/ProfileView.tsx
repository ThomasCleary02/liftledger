"use client";

import type { ReactNode } from "react";
import { ACHIEVEMENT_BY_ID, ACHIEVEMENT_CATALOG, MAX_FEATURED_ACHIEVEMENTS, type AchievementProgress } from "@liftledger/shared";
import { Avatar } from "./Avatar";
import { AchievementGrid, AchievementMedal } from "./AchievementGrid";

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export function ProfileHero({
  username,
  photoURL,
  stats,
  preview,
  busyPhoto,
  cameraSlot,
}: {
  username: string | null;
  photoURL: string | null;
  stats: AchievementProgress["stats"];
  preview?: boolean;
  busyPhoto?: boolean;
  cameraSlot?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_31px,rgb(20_83_45/0.08)_31px,rgb(20_83_45/0.08)_32px)] dark:bg-[repeating-linear-gradient(to_bottom,transparent,transparent_31px,rgb(125_186_138/0.12)_31px,rgb(125_186_138/0.12)_32px)]" />
      <div className="relative">
        {preview && <p className="kicker mb-4">Preview</p>}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={username} photoURL={photoURL} size={88} busy={busyPhoto} />
            {cameraSlot}
          </div>
          <div className="min-w-0">
            <p className="kicker mb-1">Username</p>
            <p className="truncate font-mono text-xl font-semibold tracking-tight text-gray-900">
              {username ? `@${username.replace(/^@/, "")}` : "Add username"}
            </p>
          </div>
        </div>
        <dl className="mt-5 space-y-2 font-mono text-sm">
          <LedgerRow label="Sessions" value={String(stats.loggedDays)} />
          <LedgerRow label="Streak" value={`${stats.currentStreak}d`} />
          <LedgerRow label="Best streak" value={`${stats.longestStreak}d`} />
          <LedgerRow label="Volume" value={`${compactNumber(stats.volumeLbs)} lb`} accent />
        </dl>
      </div>
    </div>
  );
}

function LedgerRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${accent ? "border-t border-dashed border-gray-200 pt-2" : ""}`}>
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-semibold tabular-nums ${accent ? "text-brand" : "text-gray-900"}`}>{value}</dd>
    </div>
  );
}

export function FeaturedRow({
  featuredIds,
  earned,
  onSelect,
  emptyHint,
}: {
  featuredIds: string[];
  earned: AchievementProgress["earned"];
  onSelect: (id: string) => void;
  emptyHint?: string;
}) {
  if (featuredIds.length === 0) {
    return emptyHint ? <p className="text-sm text-gray-500">{emptyHint}</p> : null;
  }
  return (
    <div className="flex gap-4 overflow-x-auto px-1 pb-3 pt-3">
      {featuredIds.map((id) => {
        const def = ACHIEVEMENT_BY_ID[id];
        if (!def) return null;
        return (
          <div key={id} className="flex-shrink-0">
            <AchievementMedal def={def} earned={Boolean(earned[id])} featured onClick={() => onSelect(id)} size={64} />
          </div>
        );
      })}
    </div>
  );
}

export function MedalCollection({
  progress,
  onSelect,
}: {
  progress: AchievementProgress;
  onSelect: (id: string) => void;
}) {
  const unlocked = ACHIEVEMENT_CATALOG.filter((item) => progress.earned[item.id]).length;
  return (
    <div>
      <p className="kicker mb-2">Medals</p>
      <p className="mb-6 text-sm text-gray-500">
        {unlocked} of {ACHIEVEMENT_CATALOG.length} earned. Pin up to {MAX_FEATURED_ACHIEVEMENTS} on your profile.
      </p>
      <AchievementGrid items={ACHIEVEMENT_CATALOG} earned={progress.earned} featuredIds={progress.featuredIds} onSelect={onSelect} />
    </div>
  );
}
