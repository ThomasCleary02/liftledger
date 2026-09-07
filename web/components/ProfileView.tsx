"use client";

import { ACHIEVEMENT_BY_ID, ACHIEVEMENT_CATALOG, MAX_FEATURED_ACHIEVEMENTS, type AchievementProgress } from "@liftledger/shared";
import { Avatar } from "./Avatar";
import { AchievementGrid, AchievementMedal } from "./AchievementGrid";

export function ProfileHero({
  username,
  photoURL,
  stats,
  preview,
}: {
  username: string | null;
  photoURL: string | null;
  stats: AchievementProgress["stats"];
  preview?: boolean;
}) {
  return (
    <div className="px-1">
      {preview && (
        <p className="mb-3 rounded-full bg-gray-100 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
          Preview as a friend
        </p>
      )}
      <div className="flex items-center gap-6">
        <Avatar name={username} photoURL={photoURL} size={92} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold text-gray-900">{username ? `@${username.replace(/^@/, "")}` : "Set a username"}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat value={stats.loggedDays} label="Days" />
            <Stat value={stats.currentStreak} label="Streak" />
            <Stat value={stats.longestStreak} label="Best" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

export function FeaturedRow({
  featuredIds,
  earned,
  onSelect,
}: {
  featuredIds: string[];
  earned: AchievementProgress["earned"];
  onSelect: (id: string) => void;
}) {
  if (featuredIds.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
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

export function ProfileAchievements({
  progress,
  publicView,
  onSelect,
}: {
  progress: AchievementProgress;
  publicView: boolean;
  onSelect: (id: string) => void;
}) {
  const items = publicView
    ? ACHIEVEMENT_CATALOG.filter((item) => progress.earned[item.id])
    : ACHIEVEMENT_CATALOG;
  if (publicView && items.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500">No badges on this profile yet.</p>;
  }
  return (
    <div>
      {!publicView && (
        <p className="mb-4 text-sm text-gray-500">
          Tap a badge you have earned to pin it up top. {MAX_FEATURED_ACHIEVEMENTS} max.
        </p>
      )}
      <AchievementGrid
        items={items}
        earned={progress.earned}
        featuredIds={progress.featuredIds}
        onSelect={onSelect}
      />
    </div>
  );
}
