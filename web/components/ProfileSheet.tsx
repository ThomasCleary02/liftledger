"use client";

import { useState } from "react";
import { ACHIEVEMENT_BY_ID, type AchievementProgress } from "@liftledger/shared";
import { format } from "date-fns";
import { FullScreenSheet } from "./FullScreenSheet";
import { FeaturedRow, ProfileAchievements, ProfileHero } from "./ProfileView";

export function ProfileSheet({
  open,
  username,
  photoURL,
  progress,
  onClose,
}: {
  open: boolean;
  username: string | null;
  photoURL: string | null;
  progress: AchievementProgress | null;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const data: AchievementProgress = progress ?? {
    earned: {},
    featuredIds: [],
    stats: { currentStreak: 0, longestStreak: 0, loggedDays: 0 },
  };
  const selected = selectedId ? ACHIEVEMENT_BY_ID[selectedId] : null;
  const earnedAt = selectedId ? data.earned[selectedId]?.earnedAt : undefined;

  return (
    <>
      <FullScreenSheet
        open={open}
        title={username || "Friend"}
        onClose={() => {
          setSelectedId(null);
          onClose();
        }}
        footer={null}
      >
        <ProfileHero username={username} photoURL={photoURL} stats={data.stats} />
        <div className="mt-6">
          <FeaturedRow featuredIds={data.featuredIds} earned={data.earned} onSelect={setSelectedId} />
        </div>
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Badges</h2>
          <ProfileAchievements progress={data} publicView onSelect={setSelectedId} />
        </div>
      </FullScreenSheet>
      <FullScreenSheet open={Boolean(open && selected)} title={selected?.title ?? "Badge"} onClose={() => setSelectedId(null)} footer={null}>
        {selected && (
          <div className="space-y-3">
            <p className="text-gray-700">{selected.description}</p>
            {earnedAt ? (
              <p className="text-sm text-gray-500">Earned {format(new Date(earnedAt), "MMM d, yyyy")}</p>
            ) : (
              <p className="text-sm text-gray-500">Not earned yet.</p>
            )}
          </div>
        )}
      </FullScreenSheet>
    </>
  );
}
