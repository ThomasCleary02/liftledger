"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { getAccountSummary } from "../../../../lib/firestore/account";
import { accountService, app } from "../../../../lib/firebase";
import { ArrowLeft } from "lucide-react";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { Avatar } from "../../../../components/Avatar";
import { AvatarCropModal } from "../../../../components/AvatarCropModal";
import { deleteAvatarFile, fileToAvatarPayload, uploadAvatar } from "../../../../lib/avatar";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeightInput, toStoredWeight } from "../../../../lib/utils/units";

export default function AccountSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadGen = useRef(0);
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
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    void loadProfile();
  }, [user, router, authLoading]);

  const loadProfile = async () => {
    try {
      setLoadingUsername(true);
      const summary = await getAccountSummary();
      setUsername(summary.username || "");
      setUsernameInput(summary.username || "");
      setPhotoURL(summary.photoURL);
      const display = summary.bodyweightLbs ? formatWeightInput(summary.bodyweightLbs, units) : "";
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
      toast.success("Username updated");
    } catch (error: unknown) {
      logger.error("Error saving username", error);
      toast.error(error instanceof Error ? error.message : "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const persistAvatar = async (blob: Blob, previous: string | null) => {
    const gen = ++uploadGen.current;
    if (!user) {
      setPhotoURL(previous);
      setUploadingPhoto(false);
      return;
    }
    setUploadingPhoto(true);
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
      toast.error("Could not upload that image. Try a smaller photo.");
    } finally {
      if (gen === uploadGen.current) setUploadingPhoto(false);
    }
  };

  const handleCropConfirm = async (crop: { sx: number; sy: number; size: number }) => {
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
      toast.error("Could not crop that image.");
      throw error;
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      setUploadingPhoto(true);
      await deleteAvatarFile(app, user.uid);
      await accountService.setPhotoURL(null);
      setPhotoURL(null);
    } catch (error) {
      logger.error("Error removing photo", error);
      toast.error("Could not remove profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fieldClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 flex min-h-[44px] items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-semibold">Back</span>
            </button>
            <p className="kicker mb-1">The account</p>
            <h1 className="text-2xl font-semibold text-gray-900">Identity</h1>
            <p className="mt-1 text-sm text-gray-500">Username and scale weight. The portrait lives on Profile.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="kicker">Portrait</p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar name={username || user?.email} photoURL={photoURL} size={72} busy={uploadingPhoto} />
              <div className="min-w-0 flex-1">
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
                  disabled={uploadingPhoto}
                  onClick={() => fileRef.current?.click()}
                  className="btn-primary min-h-[48px] w-full"
                >
                  {uploadingPhoto ? "Saving photo…" : photoURL ? "Crop a new photo" : "Add a photo"}
                </button>
                {photoURL && (
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => void handleRemovePhoto()}
                    className="mt-2 min-h-[44px] w-full text-sm font-semibold text-gray-600"
                  >
                    Use letter avatar
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="kicker">Ledger name</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="mt-1 font-mono text-sm text-gray-900">{user?.email || "Not set"}</p>
                <p className="mt-1 text-xs text-gray-500">Fixed to this login.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
                {loadingUsername ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="handle"
                    className={fieldClass}
                    maxLength={20}
                    onBlur={() => {
                      if (usernameInput.trim() && usernameInput !== username) void handleSaveUsername();
                    }}
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">3–20 characters. Letters, numbers, _ and -.</p>
                {usernameInput !== username && usernameInput.trim() && (
                  <button
                    type="button"
                    disabled={savingUsername}
                    onClick={() => void handleSaveUsername()}
                    className="btn-primary mt-3 min-h-[48px] w-full"
                  >
                    {savingUsername ? "Saving…" : "Save username"}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="kicker">Scale</p>
            <label className="mt-4 mb-2 block text-sm font-medium text-gray-700">
              Bodyweight ({units === "metric" ? "kg" : "lb"})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={bodyweightInput}
              onChange={(e) => setBodyweightInput(e.target.value)}
              placeholder={units === "metric" ? "80" : "180"}
              className={fieldClass}
              onBlur={() => {
                if (bodyweightInput !== savedBodyweight) void handleSaveBodyweight();
              }}
            />
            <p className="mt-1 text-xs text-gray-500">Used for extra load on calisthenics.</p>
            {bodyweightInput !== savedBodyweight && (
              <button
                type="button"
                disabled={savingWeight}
                onClick={() => void handleSaveBodyweight()}
                className="btn-primary mt-3 min-h-[48px] w-full"
              >
                {savingWeight ? "Saving…" : "Save bodyweight"}
              </button>
            )}
          </section>
        </div>
      </main>
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => {
            setCropFile(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
