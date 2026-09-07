"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACHIEVEMENT_BY_ID,
  MAX_FEATURED_ACHIEVEMENTS,
  achievementTierLabel,
  formatAchievementProgress,
  getAchievementProgress,
  toggleFeaturedId,
  type AchievementProgress,
  type AchievementProgressMetric,
} from "@liftledger/shared";
import { Camera, Pencil, Share2 } from "lucide-react";
import { useAuth } from "../../../providers/Auth";
import { accountService, app } from "../../../lib/firebase";
import { listDays } from "../../../lib/firestore/days";
import { syncEarnedAchievements } from "../../../lib/publishAchievements";
import { notifyMedalUnlocks } from "../../../lib/notifyMedalUnlocks";
import { fileToAvatarPayload, uploadAvatar } from "../../../lib/avatar";
import { shareMedalPng } from "../../../lib/shareMedalPng";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { AvatarCropModal } from "../../../components/AvatarCropModal";
import { FeaturedRow, MedalCollection, ProfileFriendsLink, ProfileHero } from "../../../components/ProfileView";
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
  const [usernameInput, setUsernameInput] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [progress, setProgress] = useState<AchievementProgress>(EMPTY);
  const [medalMetrics, setMedalMetrics] = useState<Record<string, AchievementProgressMetric>>({});
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sharingMedal, setSharingMedal] = useState(false);
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
      setUsernameInput(summary.username || "");
      setPhotoURL(summary.photoURL);
      const synced = await syncEarnedAchievements(days);
      setProgress(synced.progress);
      setMedalMetrics(getAchievementProgress(days));
      notifyMedalUnlocks(synced.added, { delayMs: 400 });
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

  const handleSaveUsername = async () => {
    try {
      setSavingUsername(true);
      await accountService.setUsername(usernameInput);
      setUsername(usernameInput);
      setEditingUsername(false);
      toast.success("Username updated");
    } catch (error: unknown) {
      logger.error("Error saving username", error);
      toast.error(error instanceof Error ? error.message : "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const selected = selectedId ? ACHIEVEMENT_BY_ID[selectedId] : null;
  const earnedAt = selectedId ? progress.earned[selectedId]?.earnedAt : undefined;
  const canPin = Boolean(selected && earnedAt);
  const selectedMetric = selectedId ? medalMetrics[selectedId] : undefined;

  const handleShareMedal = async () => {
    if (!selected || !earnedAt) return;
    setSharingMedal(true);
    try {
      const result = await shareMedalPng({
        title: selected.title,
        description: selected.description,
        tier: selected.tier,
        earnedAt,
        username,
      });
      if (result === "downloaded") toast.success("Medal image saved");
      else if (result === "previewed") toast.success("Opened medal image");
    } catch (error) {
      logger.error("Failed to share medal", error);
      toast.error("Could not share that medal");
    } finally {
      setSharingMedal(false);
    }
  };

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
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
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
            usernameSlot={
              editingUsername ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="username"
                    maxLength={20}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-base text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">3–20 characters. Letters, numbers, _ and -.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingUsername || !usernameInput.trim()}
                      onClick={() => void handleSaveUsername()}
                      className="btn-primary min-h-[40px] flex-1 px-3 text-sm"
                    >
                      {savingUsername ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={savingUsername}
                      onClick={() => {
                        setUsernameInput(username || "");
                        setEditingUsername(false);
                      }}
                      className="btn-secondary min-h-[40px] px-3 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingUsername(true)}
                  className="group flex max-w-full items-center gap-2 text-left"
                >
                  <span className="truncate font-mono text-2xl font-semibold tracking-tight text-gray-900">
                    {username ? `@${username.replace(/^@/, "")}` : "Add username"}
                  </span>
                  <Pencil className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-700" />
                </button>
              )
            }
          />

          <ProfileFriendsLink />

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="kicker">Collection</p>
                <h2 className="text-lg font-semibold text-gray-900">Pinned medals</h2>
              </div>
              <button type="button" onClick={() => setCollectionOpen(true)} className="text-sm font-semibold text-brand">
                All medals
              </button>
            </div>
            <FeaturedRow
              featuredIds={progress.featuredIds}
              earned={progress.earned}
              onSelect={setSelectedId}
              emptyHint="Pin up to three medals from your collection."
            />
          </section>
        </div>
      </main>

      {cropFile && (
        <AvatarCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={handleCrop} />
      )}

      <FullScreenSheet open={collectionOpen} title="All medals" onClose={() => setCollectionOpen(false)}>
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
          <MedalCollection progress={progress} progressById={medalMetrics} onSelect={setSelectedId} />
        </div>
      </FullScreenSheet>

      <FullScreenSheet
        open={Boolean(selected)}
        title={selected?.title ?? "Medal"}
        onClose={() => setSelectedId(null)}
        footer={
          canPin || earnedAt ? (
            <div className="flex w-full flex-col gap-2">
              {earnedAt ? (
                <button
                  type="button"
                  className="btn-secondary flex min-h-[48px] w-full items-center justify-center gap-2"
                  disabled={sharingMedal}
                  onClick={() => void handleShareMedal()}
                >
                  <Share2 className="h-4 w-4" />
                  {sharingMedal ? "Sharing…" : "Share medal"}
                </button>
              ) : null}
              {canPin ? (
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
              ) : null}
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-gray-500">
              {achievementTierLabel(selected.tier)} · Tier {selected.tier}
            </p>
            <p className="mt-3 text-gray-700">{selected.description}</p>
            {earnedAt ? (
              <p className="mt-3 font-mono text-sm text-gray-500">Earned {format(new Date(earnedAt), "MMM d, yyyy")}</p>
            ) : selectedMetric ? (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-mono tabular-nums text-gray-700">{formatAchievementProgress(selectedMetric)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${Math.max(4, Math.min(100, (selectedMetric.current / selectedMetric.target) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Not earned yet.</p>
            )}
          </div>
        )}
      </FullScreenSheet>
    </div>
  );
}
