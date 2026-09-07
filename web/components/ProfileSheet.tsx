"use client";

import { useState } from "react";
import { ACHIEVEMENT_BY_ID, type AchievementProgress } from "@liftledger/shared";
import { format } from "date-fns";
import { FullScreenSheet } from "./FullScreenSheet";
import { FeaturedRow, ProfileHero } from "./ProfileView";

const EMPTY: AchievementProgress = {
  earned: {},
  featuredIds: [],
  stats: { currentStreak: 0, longestStreak: 0, loggedDays: 0, volumeLbs: 0 },
};

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
  const data = progress ?? EMPTY;
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
        <section className="mt-4 rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
          <p className="kicker">Pinned</p>
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Medals</h2>
          <FeaturedRow
            featuredIds={data.featuredIds}
            earned={data.earned}
            onSelect={setSelectedId}
            emptyHint="No medals pinned yet."
          />
        </section>
      </FullScreenSheet>
      <FullScreenSheet open={Boolean(open && selected)} title={selected?.title ?? "Medal"} onClose={() => setSelectedId(null)} footer={null}>
        {selected && (
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="text-gray-700">{selected.description}</p>
            {earnedAt ? (
              <p className="mt-3 font-mono text-sm text-gray-500">Earned {format(new Date(earnedAt), "MMM d, yyyy")}</p>
            ) : null}
          </div>
        )}
      </FullScreenSheet>
    </>
  );
}
