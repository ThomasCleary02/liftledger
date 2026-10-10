"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ACHIEVEMENT_BY_ID,
  MAX_FEATURED_ACHIEVEMENTS,
  browseAchievementCatalog,
  formatAchievementProgress,
  type AchievementDef,
  type AchievementProgress,
  type AchievementProgressMetric,
} from "@liftledger/shared";
import { ChevronRight, Users } from "lucide-react";
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
  usernameSlot,
}: {
  username: string | null;
  photoURL: string | null;
  stats: AchievementProgress["stats"];
  busyPhoto?: boolean;
  cameraSlot?: ReactNode;
  usernameSlot?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.14)]">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <Avatar name={username} photoURL={photoURL} size={88} busy={busyPhoto} />
          {cameraSlot}
        </div>
        <div className="min-w-0 flex-1">
          <p className="kicker mb-1">Athlete</p>
          {usernameSlot ?? (
            <p className="truncate font-mono text-2xl font-semibold tracking-tight text-gray-900">
              {username ? `@${username.replace(/^@/, "")}` : "Add username"}
            </p>
          )}
        </div>
      </div>
      <dl className="mt-5 divide-y divide-gray-100 border-t border-gray-100 font-mono text-sm">
        <LedgerRow label="Sessions" value={String(stats.loggedDays)} />
        <LedgerRow label="Streak" value={`${stats.currentStreak}d`} />
        <LedgerRow label="Best streak" value={`${stats.longestStreak}d`} />
        <LedgerRow label="Volume" value={`${compactNumber(stats.volumeLbs)} lb`} />
      </dl>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold tabular-nums text-gray-900">{value}</dd>
    </div>
  );
}

export function ProfileFriendsLink() {
  return (
    <Link
      href="/profile/friends"
      className="flex min-h-[52px] items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_0_rgb(20_83_45/0.08)] transition-colors hover:bg-gray-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Users className="h-4 w-4" />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-sm font-semibold text-gray-900">Friends</span>
        <span className="block text-xs text-gray-500">Requests, list, and leaderboards</span>
      </span>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}

export type ActiveChallengeItem = {
  def: AchievementDef;
  metric: AchievementProgressMetric;
  windowDays: number;
};

export function ActiveChallenges({
  items,
  onSelect,
}: {
  items: ActiveChallengeItem[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)] dark:border-gray-700 dark:bg-gray-950 dark:shadow-none">
      <p className="kicker mb-3">Active challenges</p>
      <ul className="space-y-2">
        {items.map(({ def, metric, windowDays }) => {
          const ratio = metric.target > 0 ? metric.current / metric.target : 0;
          const nearComplete = ratio >= 0.7;
          const progressText = formatAchievementProgress(metric);
          return (
            <li key={def.id}>
              <button
                type="button"
                onClick={() => onSelect(def.id)}
                aria-label={`${def.title}, ${progressText}, ${windowDays}-day window`}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  nearComplete
                    ? "border-brand/45 bg-brand/[0.04] shadow-[inset_0_0_0_1px_rgb(20_83_45/0.08)] hover:bg-brand/[0.07] dark:bg-brand/10 dark:hover:bg-brand/15"
                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-900"
                }`}
              >
                <AchievementMedal
                  def={def}
                  earned={false}
                  forceColor
                  showTitle={false}
                  size={48}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="block text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                      {def.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {windowDays}d
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className={nearComplete ? "font-medium text-brand" : "text-gray-500 dark:text-gray-400"}>
                      {nearComplete ? "Almost there" : "Progress"}
                    </span>
                    <span className="font-mono tabular-nums text-gray-700 dark:text-gray-300">
                      {progressText}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <span
                      className={`block h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none ${nearComplete ? "bg-brand" : "bg-brand/70"}`}
                      style={{ width: `${Math.max(4, Math.min(100, ratio * 100))}%` }}
                    />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [kindFilter, setKindFilter] = useState<"all" | "challenge" | "lifetime">(() => {
    if (typeof window === "undefined") return "all";
    try {
      const raw = sessionStorage.getItem("ll-medal-kind");
      if (raw === "challenge" || raw === "lifetime" || raw === "all") return raw;
    } catch {
      /* ignore */
    }
    return "all";
  });
  /** Default: common → rare (Platinum at the bottom). */
  const [rareFirst, setRareFirst] = useState(false);
  const catalog = useMemo(() => browseAchievementCatalog(progress.earned), [progress.earned]);
  const unlocked = catalog.filter((item) => progress.earned[item.id]).length;

  useEffect(() => {
    try {
      sessionStorage.setItem("ll-medal-kind", kindFilter);
    } catch {
      /* ignore */
    }
  }, [kindFilter]);

  const items = useMemo(() => {
    const sorted = [...catalog].sort((a, b) => {
      if (a.tier !== b.tier) return rareFirst ? b.tier - a.tier : a.tier - b.tier;
      return a.title.localeCompare(b.title);
    });
    return sorted.filter((item) => {
      if (filter === "earned" && !progress.earned[item.id]) return false;
      if (filter === "locked" && progress.earned[item.id]) return false;
      if (kindFilter === "challenge" && item.kind !== "challenge") return false;
      if (kindFilter === "lifetime" && item.kind !== "lifetime") return false;
      return true;
    });
  }, [catalog, filter, kindFilter, rareFirst, progress.earned]);

  const chipClass = (active: boolean) =>
    `flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
      active
        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
        : "text-gray-600 dark:text-gray-400"
    }`;

  return (
    <div>
      <p className="kicker mb-2">Medals</p>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {unlocked} of {catalog.length} earned. Pin up to {MAX_FEATURED_ACHIEVEMENTS} on your profile.
      </p>
      <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
        {(
          [
            { id: "all", label: "All" },
            { id: "earned", label: "Earned" },
            { id: "locked", label: "Locked" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={chipClass(filter === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
        {(
          [
            { id: "all", label: "Any" },
            { id: "challenge", label: "Challenges" },
            { id: "lifetime", label: "Lifetime" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setKindFilter(opt.id)}
            className={chipClass(kindFilter === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setRareFirst((v) => !v)}
          className="text-xs font-semibold text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
        >
          {rareFirst ? "Sort: rare → common" : "Sort: common → rare"}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {filter === "earned" ? "No medals earned yet." : "Nothing in this filter."}
        </p>
      ) : (
        <AchievementGrid
          items={items}
          earned={progress.earned}
          featuredIds={progress.featuredIds}
          progressById={progressById}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
