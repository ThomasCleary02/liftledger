"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { accountService, app } from "../../../../lib/firebase";
import { ArrowLeft } from "lucide-react";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { Avatar } from "../../../../components/Avatar";
import { deleteAvatarFile, fileToAvatarBlob, uploadAvatar } from "../../../../lib/avatar";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeightInput, toStoredWeight } from "../../../../lib/utils/units";

export default function AccountSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { units } = usePreferences();
  const [username, setUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [bodyweightInput, setBodyweightInput] = useState("");
  const [savedBodyweight, setSavedBodyweight] = useState("");
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }
    loadProfile();
  }, [user, router, authLoading]);

  const loadProfile = async () => {
    try {
      setLoadingUsername(true);
      const [currentUsername, currentPhoto, bodyweightLbs] = await Promise.all([
        accountService.getUsername(),
        accountService.getPhotoURL(),
        accountService.getBodyweightLbs(),
      ]);
      setUsername(currentUsername || "");
      setUsernameInput(currentUsername || "");
      setPhotoURL(currentPhoto);
      const display = bodyweightLbs ? formatWeightInput(bodyweightLbs, units) : "";
      setBodyweightInput(display);
      setSavedBodyweight(display);
    } catch (error) {
      logger.error("Error loading profile", error);
    } finally {
      setLoadingUsername(false);
    }
  };

  const handleSaveBodyweight = async () => {
    try {
      setSavingWeight(true);
      const parsed = Number(bodyweightInput);
      if (bodyweightInput.trim() && (!Number.isFinite(parsed) || parsed <= 0)) {
        toast.error("Enter a bodyweight greater than 0");
        return;
      }
      await accountService.setBodyweightLbs(bodyweightInput.trim() ? toStoredWeight(parsed, units) : null);
      setSavedBodyweight(bodyweightInput);
      toast.success("Bodyweight saved");
    } catch (error) {
      logger.error("Error saving bodyweight", error);
      toast.error("Failed to save bodyweight");
    } finally {
      setSavingWeight(false);
    }
  };

  const handleSaveUsername = async () => {
    try {
      setSavingUsername(true);
      await accountService.setUsername(usernameInput);
      setUsername(usernameInput);
      toast.success("Username updated successfully");
    } catch (error: unknown) {
      logger.error("Error saving username", error);
      toast.error(error instanceof Error ? error.message : "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePickPhoto = async (file: File | undefined) => {
    if (!file || !user) return;
    try {
      setUploadingPhoto(true);
      const blob = await fileToAvatarBlob(file);
      const url = await uploadAvatar(app, user.uid, blob);
      await accountService.setPhotoURL(url);
      setPhotoURL(url);
      toast.success("Profile picture updated");
    } catch (error) {
      logger.error("Error uploading photo", error);
      toast.error("Could not upload that image. Use a photo under 512 KB after crop.");
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      setUploadingPhoto(true);
      await deleteAvatarFile(app, user.uid);
      await accountService.setPhotoURL(null);
      setPhotoURL(null);
      toast.success("Profile picture removed");
    } catch (error) {
      logger.error("Error removing photo", error);
      toast.error("Could not remove profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Account Settings</h1>
            <p className="text-sm text-gray-500">Customize your profile</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Profile Picture</h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar name={username || user?.email} photoURL={photoURL} size={64} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Profile Picture</p>
                    <p className="text-sm text-gray-500">Square crop, shown to friends on leaderboards</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handlePickPhoto(event.target.files?.[0])}
                      />
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                      >
                        {uploadingPhoto ? "Saving..." : photoURL ? "Change photo" : "Upload photo"}
                      </button>
                      {photoURL && (
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={handleRemovePhoto}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Account Information</h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{user?.email || "Not set"}</p>
                    <p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  {loadingUsername ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Enter username"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        maxLength={20}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={savingUsername || usernameInput === username || !usernameInput.trim()}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800"
                      >
                        {savingUsername ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    3-20 characters, letters, numbers, underscores, and hyphens only
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bodyweight ({units === "metric" ? "kg" : "lb"})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bodyweightInput}
                      onChange={(e) => setBodyweightInput(e.target.value)}
                      placeholder={units === "metric" ? "80" : "180"}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={handleSaveBodyweight}
                      disabled={savingWeight || bodyweightInput === savedBodyweight}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800"
                    >
                      {savingWeight ? "Saving..." : "Save"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used when you log extra weight on calisthenics (dips, pull-ups).
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
