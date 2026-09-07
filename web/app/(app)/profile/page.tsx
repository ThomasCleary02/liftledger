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
import { Camera, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../providers/Auth";
import { accountService, app } from "../../../lib/firebase";
import { listDays } from "../../../lib/firestore/days";
import { syncEarnedAchievements } from "../../../lib/publishAchievements";
import { deleteAvatarFile, fileToAvatarBlob, uploadAvatar } from "../../../lib/avatar";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { AvatarCropModal } from "../../../components/AvatarCropModal";
import { FeaturedRow, ProfileAchievements, ProfileHero } from "../../../components/ProfileView";
import { FullScreenSheet } from "../../../components/FullScreenSheet";
import { format } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [progress, setProgress] = useState<AchievementProgress>({
    earned: {},
    featuredIds: [],
    stats: { currentStreak: 0, longestStreak: 0, loggedDays: 0 },
  });
  const [preview, setPreview] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      const [summary, days] = await Promise.all([accountService.getAccountSummary(), listDays({ limit: 250, order: "desc" })]);
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
      toast.error("Could not update badges");
    }
  };

  const handleCrop = async (crop: { sx: number; sy: number; size: number }) => {
    const file = cropFile;
    if (!file || !user) return;
    setCropFile(null);
    try {
      setUploading(true);
      const blob = await fileToAvatarBlob(file, crop);
      const url = await uploadAvatar(app, user.uid, blob);
      const withBust = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      await accountService.setPhotoURL(withBust);
      setPhotoURL(withBust);
      toast.success("Photo updated");
    } catch (error) {
      logger.error("Error uploading photo", error);
      toast.error("Could not save that crop. Try a smaller image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      setUploading(true);
      await deleteAvatarFile(app, user.uid);
      await accountService.setPhotoURL(null);
      setPhotoURL(null);
      toast.success("Using your letter avatar");
    } catch (error) {
      logger.error("Error removing photo", error);
      toast.error("Could not remove photo");
    } finally {
      setUploading(false);
    }
  };

  const selected = selectedId ? ACHIEVEMENT_BY_ID[selectedId] : null;
  const earnedAt = selectedId ? progress.earned[selectedId]?.earnedAt : undefined;

  if (authLoading || !user || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <header className="flex-shrink-0 border-b border-gray-200 px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className="flex min-h-[44px] items-center gap-2 rounded-full px-3 text-sm font-semibold text-gray-700"
          >
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Exit preview" : "Preview"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6">
          <ProfileHero username={username} photoURL={photoURL} stats={progress.stats} preview={preview} />

          {!preview && (
            <div className="mt-4 flex flex-wrap gap-2">
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
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="btn-secondary flex min-h-[44px] items-center gap-2 px-4"
              >
                <Camera className="h-4 w-4" />
                {uploading ? "Saving…" : photoURL ? "Change photo" : "Add photo"}
              </button>
              {photoURL && (
                <button type="button" disabled={uploading} onClick={() => void handleRemovePhoto()} className="rounded-lg px-3 text-sm font-semibold text-gray-600">
                  Use avatar
                </button>
              )}
              <Link href="/settings/account" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand">
                Account
              </Link>
            </div>
          )}

          <div className="mt-6">
            <FeaturedRow featuredIds={progress.featuredIds} earned={progress.earned} onSelect={setSelectedId} />
          </div>

          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {preview ? "Badges" : "Collection"}
          </h2>
          <ProfileAchievements progress={progress} publicView={preview} onSelect={setSelectedId} />
        </div>
      </main>

      {cropFile && (
        <AvatarCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(crop) => void handleCrop(crop)} />
      )}

      <FullScreenSheet
        open={Boolean(selected)}
        title={selected?.title ?? "Badge"}
        onClose={() => setSelectedId(null)}
        footer={
          !preview && selected && earnedAt ? (
            <button
              type="button"
              className="btn-primary min-h-[48px] w-full"
              onClick={() => {
                if (!selected) return;
                if (!progress.featuredIds.includes(selected.id) && progress.featuredIds.length >= MAX_FEATURED_ACHIEVEMENTS) {
                  toast.error(`You can pin ${MAX_FEATURED_ACHIEVEMENTS} badges`);
                  return;
                }
                void persistProgress({
                  ...progress,
                  featuredIds: toggleFeaturedId(progress.featuredIds, selected.id, progress.earned),
                });
              }}
            >
              {progress.featuredIds.includes(selected.id) ? "Hide from profile" : "Show on profile"}
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-gray-700">{selected.description}</p>
            {earnedAt ? (
              <p className="text-sm text-gray-500">Earned {format(new Date(earnedAt), "MMM d, yyyy")}</p>
            ) : (
              <p className="text-sm text-gray-500">Not earned yet. Keep logging.</p>
            )}
          </div>
        )}
      </FullScreenSheet>
    </div>
  );
}
