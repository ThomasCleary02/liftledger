import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";

const PATH = (uid: string) => `avatars/${uid}/profile.jpg`;

export type AvatarCrop = {
  sx: number;
  sy: number;
  size: number;
};

export function clampAvatarCrop(
  crop: AvatarCrop,
  width: number,
  height: number
): AvatarCrop {
  const maxSide = Math.min(width, height);
  const size = Math.max(1, Math.min(crop.size, maxSide));
  const sx = Math.min(Math.max(0, crop.sx), Math.max(0, width - size));
  const sy = Math.min(Math.max(0, crop.sy), Math.max(0, height - size));
  return { sx, sy, size };
}

export async function fileToAvatarPayload(
  file: File,
  crop?: AvatarCrop
): Promise<{ blob: Blob; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  try {
    const fallback = Math.min(bitmap.width, bitmap.height);
    const clamped = clampAvatarCrop(
      crop ?? { sx: (bitmap.width - fallback) / 2, sy: (bitmap.height - fallback) / 2, size: fallback },
      bitmap.width,
      bitmap.height
    );
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(bitmap, clamped.sx, clamped.sy, clamped.size, clamped.size, 0, 0, 256, 256);
    const previewUrl = canvas.toDataURL("image/jpeg", 0.82);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("Could not encode image"))),
        "image/jpeg",
        0.82
      );
    });
    return { blob, previewUrl };
  } finally {
    bitmap.close();
  }
}

export async function fileToAvatarBlob(file: File, crop?: AvatarCrop): Promise<Blob> {
  const { blob } = await fileToAvatarPayload(file, crop);
  return blob;
}

export async function uploadAvatar(app: FirebaseApp, uid: string, blob: Blob): Promise<string> {
  const storage = getStorage(app);
  const fileRef = ref(storage, PATH(uid));
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(fileRef);
}

export async function deleteAvatarFile(app: FirebaseApp, uid: string): Promise<void> {
  const storage = getStorage(app);
  try {
    await deleteObject(ref(storage, PATH(uid)));
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code !== "storage/object-not-found") throw error;
  }
}
