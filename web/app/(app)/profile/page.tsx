"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACHIEVEMENT_BY_ID,
  MAX_FEATURED_ACHIEVEMENTS,
  toggleFeaturedId,
  type AchievementProgress,
} from "@liftledger/shared";
import { Camera } from "lucide-react";
import { useAuth } from "../../../providers/Auth";
import { accountService, app } from "../../../lib/firebase";
import { listDays } from "../../../lib/firestore/days";
import { syncEarnedAchievements } from "../../../lib/publishAchievements";
import { fileToAvatarPayload, uploadAvatar } from "../../../lib/avatar";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { AvatarCropModal } from "../../../components/AvatarCropModal";
import { FeaturedRow, MedalCollection, ProfileHero } from "../../../components/ProfileView";
import { FullScreenSheet } from "../../../components/FullScreenSheet";
import { format } from "date-fns";

const EMPTY: AchievementProgress = {
  earned: {},
  featuredIds: [],
  stats: { currentStreak: 0, longestStreak: 0, loggedDays: 0, volumeLbs: 0 },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadGen = useRef(0);
  const [username, setUsername] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [progress, setProgress] = useState<AchievementProgress>(EMPTY);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    void load();
  }, [user, router, authLoading]);

  const load = async () => {
    try {
      const [summary, days] = await Promise.all([
        accountService.getAccountSummary(),
        listDays({ limit: 2000, order: "desc" }),
      ]);
      setUsername(summary.username);
      setPhotoURL(summary.photoURL);
      const synced = await syncEarnedAchievements(days);
      setProgress(synced.progress);
    } catch (error) {
      logger.error("Failed to load profile", error);
      toast.error("Could not load profile");
    } finally {
      setReady(true);
    }
  };

  const persistProgress = async (next: AchievementProgress) => {
    setProgress(next);
    try {
      await accountService.setAchievementProgress(next);
    } catch (error) {
      logger.error("Failed to save badges", error);
      toast.error("Could not update medals");
    }
  };

  const persistAvatar = async (blob: Blob, previous: string | null) => {
    const gen = ++uploadGen.current;
    if (!user) {
      setPhotoURL(previous);
      setUploading(false);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(app, user.uid, blob);
      const withBust = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      await accountService.setPhotoURL(withBust);
      if (gen !== uploadGen.current) return;
      setPhotoURL(withBust);
    } catch (error) {
      logger.error("Error uploading photo", error);
      if (gen !== uploadGen.current) return;
      setPhotoURL(previous);
      toast.error("Could not save that photo. Try a smaller image.");
    } finally {
      if (gen === uploadGen.current) setUploading(false);
    }
  };

  const handleCrop = async (crop: { sx: number; sy: number; size: number }) => {
    const file = cropFile;
    const previous = photoURL;
    if (!file || !user) return;
    try {
      const { blob, previewUrl } = await fileToAvatarPayload(file, crop);
      setPhotoURL(previewUrl);
      setCropFile(null);
      if (fileRef.current) fileRef.current.value = "";
      void persistAvatar(blob, previous);
    } catch (error) {
      logger.error("Error cropping photo", error);
      toast.error("Could not use that image.");
      throw error;
    }
  };

  const selected = selectedId ? ACHIEVEMENT_BY_ID[selectedId] : null;
  const earnedAt = selectedId ? progress.earned[selectedId]?.earnedAt : undefined;
  const canPin = Boolean(selected && earnedAt);

  if (authLoading || !user || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="kicker">Profile</p>
            <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
            <p className="text-xs text-gray-500">How friends see you</p>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings/account" className="min-h-[44px] px-3 py-2 text-sm font-semibold text-brand">
              Account
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setCropFile(file);
            }}
          />
          <ProfileHero
            username={username}
            photoURL={photoURL}
            stats={progress.stats}
            busyPhoto={uploading}
            cameraSlot={
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-brand text-brand-fg"
                aria-label={photoURL ? "Change photo" : "Add photo"}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            }
          />

          <section className="mt-4 rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <div className="flex items-end justify-between">
              <div>
                <p className="kicker">Pinned</p>
                <h2 className="text-lg font-semibold text-gray-900">Medals</h2>
              </div>
              <button type="button" onClick={() => setCollectionOpen(true)} className="text-sm font-semibold text-brand">
                All medals
              </button>
            </div>
            <FeaturedRow
              featuredIds={progress.featuredIds}
              earned={progress.earned}
              onSelect={setSelectedId}
              emptyHint="Pin up to three medals."
            />
          </section>
        </div>
      </main>

      {cropFile && (
        <AvatarCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={handleCrop} />
      )}

      <FullScreenSheet open={collectionOpen} title="All medals" onClose={() => setCollectionOpen(false)}>
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
          <MedalCollection progress={progress} onSelect={setSelectedId} />
        </div>
      </FullScreenSheet>

      <FullScreenSheet
        open={Boolean(selected)}
        title={selected?.title ?? "Medal"}
        onClose={() => setSelectedId(null)}
        footer={
          canPin ? (
            <button
              type="button"
              className="btn-primary min-h-[48px] w-full"
              onClick={() => {
                if (!selected) return;
                if (!progress.featuredIds.includes(selected.id) && progress.featuredIds.length >= MAX_FEATURED_ACHIEVEMENTS) {
                  toast.error(`You can pin up to ${MAX_FEATURED_ACHIEVEMENTS} medals.`);
                  return;
                }
                void persistProgress({
                  ...progress,
                  featuredIds: toggleFeaturedId(progress.featuredIds, selected.id, progress.earned),
                });
              }}
            >
              {selected && progress.featuredIds.includes(selected.id) ? "Unpin" : "Pin to profile"}
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="text-gray-700">{selected.description}</p>
            {earnedAt ? (
              <p className="mt-3 font-mono text-sm text-gray-500">Earned {format(new Date(earnedAt), "MMM d, yyyy")}</p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Not earned yet.</p>
            )}
          </div>
        )}
      </FullScreenSheet>
    </div>
  );
}
