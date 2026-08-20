import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export const EMAIL_INDEX_COLLECTION = "emailIndex";

export async function lookupUserIdByEmail(
  db: Firestore,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const snap = await getDoc(doc(db, EMAIL_INDEX_COLLECTION, normalized));
  if (!snap.exists()) return null;
  const userId = snap.data()?.userId;
  return typeof userId === "string" ? userId : null;
}

export async function writeEmailIndex(
  db: Firestore,
  userId: string,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return;
  await setDoc(doc(db, EMAIL_INDEX_COLLECTION, normalized), { userId });
}

export async function deleteEmailIndex(db: Firestore, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await deleteDoc(doc(db, EMAIL_INDEX_COLLECTION, normalized));
}
