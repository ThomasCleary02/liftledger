"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_CATALOG,
  MAX_FEATURED_ACHIEVEMENTS,
  type AchievementProgress,
  type AchievementProgressMetric,
} from "@liftledger/shared";
import { ChevronRight, Trophy, Users } from "lucide-react";
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
  busyPhoto,
  cameraSlot,
}: {
  username: string | null;
  photoURL: string | null;
  stats: AchievementProgress["stats"];
  busyPhoto?: boolean;
  cameraSlot?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_31px,rgb(20_83_45/0.08)_31px,rgb(20_83_45/0.08)_32px)] dark:bg-[repeating-linear-gradient(to_bottom,transparent,transparent_31px,rgb(125_186_138/0.12)_31px,rgb(125_186_138/0.12)_32px)]" />
      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={username} photoURL={photoURL} size={88} busy={busyPhoto} />
            {cameraSlot}
          </div>
          <div className="min-w-0">
            <p className="kicker mb-1">Athlete</p>
            <p className="truncate font-mono text-2xl font-semibold tracking-tight text-gray-900">
              {username ? `@${username.replace(/^@/, "")}` : "Add username"}
            </p>
            <p className="mt-1 text-sm text-gray-500">How friends see you</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Sessions" value={String(stats.loggedDays)} />
          <StatChip label="Streak" value={`${stats.currentStreak}d`} />
          <StatChip label="Best" value={`${stats.longestStreak}d`} />
          <StatChip label="Volume" value={`${compactNumber(stats.volumeLbs)} lb`} accent />
        </dl>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${accent ? "border-brand/30 bg-brand/5" : "border-gray-100 bg-gray-50"}`}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">{label}</dt>
      <dd className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${accent ? "text-brand" : "text-gray-900"}`}>{value}</dd>
    </div>
  );
}

export function ProfileFriendsLinks() {
  return (
    <section className="rounded-md border border-gray-200 bg-white shadow-[0_1px_0_rgb(20_83_45/0.08)]">
      <Link
        href="/friends"
        className="flex min-h-[52px] items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <Users className="h-4 w-4" />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-sm font-semibold text-gray-900">Friends</span>
          <span className="block text-xs text-gray-500">Requests and your list</span>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>
      <div className="border-t border-gray-100" />
      <Link
        href="/friends/leaderboards"
        className="flex min-h-[52px] items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <Trophy className="h-4 w-4" />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-sm font-semibold text-gray-900">Leaderboards</span>
          <span className="block text-xs text-gray-500">Volume and streak boards</span>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>
    </section>
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
    return emptyHint ? <p className="mt-3 text-sm text-gray-500">{emptyHint}</p> : null;
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
  progressById,
  onSelect,
}: {
  progress: AchievementProgress;
  progressById?: Record<string, AchievementProgressMetric>;
  onSelect: (id: string) => void;
}) {
  const unlocked = ACHIEVEMENT_CATALOG.filter((item) => progress.earned[item.id]).length;
  return (
    <div>
      <p className="kicker mb-2">Medals</p>
      <p className="mb-6 text-sm text-gray-500">
        {unlocked} of {ACHIEVEMENT_CATALOG.length} earned. Pin up to {MAX_FEATURED_ACHIEVEMENTS} on your profile.
      </p>
      <AchievementGrid
        items={ACHIEVEMENT_CATALOG}
        earned={progress.earned}
        featuredIds={progress.featuredIds}
        progressById={progressById}
        onSelect={onSelect}
      />
    </div>
  );
}
