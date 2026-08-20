import type { Firestore } from "firebase/firestore";
import { doc, getDoc, deleteDoc, runTransaction } from "firebase/firestore";

export const USERNAME_INDEX_COLLECTION = "usernameIndex";

export function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, "").toLowerCase();
}

export async function lookupUserIdByUsername(
  db: Firestore,
  username: string
): Promise<string | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  const snap = await getDoc(doc(db, USERNAME_INDEX_COLLECTION, normalized));
  if (!snap.exists()) return null;
  const userId = snap.data()?.userId;
  return typeof userId === "string" ? userId : null;
}

export async function claimUsername(
  db: Firestore,
  userId: string,
  username: string
): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) return;
  const ref = doc(db, USERNAME_INDEX_COLLECTION, normalized);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists() && snap.data()?.userId !== userId) {
      throw new Error("That username is taken");
    }
    tx.set(ref, { userId });
  });
}

export async function deleteUsernameIndex(db: Firestore, username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) return;
  await deleteDoc(doc(db, USERNAME_INDEX_COLLECTION, normalized));
}
