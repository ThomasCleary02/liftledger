import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";

const PATH = (uid: string) => `avatars/${uid}/profile.jpg`;

export async function fileToAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 256, 256);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      0.85
    );
  });
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
