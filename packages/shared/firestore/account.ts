import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { deleteEmailIndex, writeEmailIndex } from "./emailIndex";
import { claimUsername, deleteUsernameIndex, lookupUserIdByUsername } from "./usernameIndex";

const WORKOUTS_COLLECTION = "workouts";
const ACCOUNTS_COLLECTION = "accounts";
const DAYS_COLLECTION = "days";
const TEMPLATES_COLLECTION = "workoutTemplates";
const FRIENDS_COLLECTION = "friends";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";

async function deleteMatching(
  db: Firestore,
  collectionName: string,
  field: string,
  value: string
): Promise<void> {
  const snapshot = await getDocs(query(collection(db, collectionName), where(field, "==", value)));
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

export function createAccountService(db: Firestore, auth: Auth) {
  const persistEmailIndex = async () => {
    const user = auth.currentUser;
    if (!user?.email) return;
    await writeEmailIndex(db, user.uid, user.email);
    await setDoc(
      doc(db, ACCOUNTS_COLLECTION, user.uid),
      { email: user.email.toLowerCase() },
      { merge: true }
    );
    const accountDoc = await getDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));
    const username = accountDoc.exists() ? accountDoc.data()?.username : undefined;
    if (typeof username === "string" && username) {
      try {
        await claimUsername(db, user.uid, username);
      } catch {
        const owner = await lookupUserIdByUsername(db, username);
        if (owner && owner !== user.uid) {
          await setDoc(
            doc(db, ACCOUNTS_COLLECTION, user.uid),
            { username: deleteField() },
            { merge: true }
          );
        }
      }
    }
  };

  return {
    async ensureEmailIndex(): Promise<void> {
      await persistEmailIndex();
    },

    async deleteUserAccount(): Promise<void> {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user signed in");
      }

      try {
        const accountSnap = await getDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));
        const username = accountSnap.exists() ? accountSnap.data()?.username : undefined;

        await Promise.all([
          deleteMatching(db, DAYS_COLLECTION, "userId", user.uid),
          deleteMatching(db, TEMPLATES_COLLECTION, "ownerId", user.uid),
          deleteMatching(db, WORKOUTS_COLLECTION, "ownerId", user.uid),
          deleteMatching(db, FRIENDS_COLLECTION, "userId", user.uid),
          deleteMatching(db, FRIENDS_COLLECTION, "friendUserId", user.uid),
          deleteMatching(db, FRIEND_REQUESTS_COLLECTION, "fromUserId", user.uid),
          deleteMatching(db, FRIEND_REQUESTS_COLLECTION, "toUserId", user.uid),
        ]);

        if (user.email) {
          await deleteEmailIndex(db, user.email);
        }
        if (typeof username === "string" && username) {
          await deleteUsernameIndex(db, username);
        }

        await deleteDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));
        await deleteUser(user);
      } catch (error: any) {
        console.error("Error deleting account:", error);
        throw new Error(error?.message || "Failed to delete account");
      }
    },

    async getFavoriteExercises(): Promise<string[]> {
      const user = auth.currentUser;
      if (!user) return [];

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        
        // Ensure account document exists with email (for friend requests)
        if (!accountDoc.exists() || !accountDoc.data().email) {
          const accountData: any = {};
          if (user.email) {
            accountData.email = user.email.toLowerCase();
          }
          if (accountDoc.exists()) {
            // Merge existing data
            const existing = accountDoc.data();
            accountData.favoriteExercises = existing.favoriteExercises || [];
            accountData.trackedExercises = existing.trackedExercises || [];
          }
          await setDoc(accountRef, accountData, { merge: true });
          await persistEmailIndex();
        }
        
        if (accountDoc.exists()) {
          const data = accountDoc.data();
          return data.favoriteExercises || [];
        }
        return [];
      } catch (error) {
        console.error("Error getting favorite exercises:", error);
        return [];
      }
    },

    async toggleFavoriteExercise(exerciseId: string): Promise<boolean> {
      const user = auth.currentUser;
      if (!user) throw new Error("No user signed in");

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        
        const currentFavorites = accountDoc.exists() 
          ? (accountDoc.data().favoriteExercises || [])
          : [];
        
        const isFavorite = currentFavorites.includes(exerciseId);
        const newFavorites = isFavorite
          ? currentFavorites.filter((id: string) => id !== exerciseId)
          : [...currentFavorites, exerciseId];

        // Ensure email is stored for friend request lookups
        const accountData: any = {
          favoriteExercises: newFavorites,
          updatedAt: new Date().toISOString(),
        };
        
        // Store email if available (normalized to lowercase)
        if (user.email) {
          accountData.email = user.email.toLowerCase();
        }

        await setDoc(accountRef, accountData, { merge: true });
          await persistEmailIndex();

        return !isFavorite;
      } catch (error) {
        console.error("Error toggling favorite exercise:", error);
        throw error;
      }
    },

    async getTrackedExercises(): Promise<string[]> {
      const user = auth.currentUser;
      if (!user) return [];

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        
        // Ensure account document exists with email (for friend requests)
        if (!accountDoc.exists() || !accountDoc.data().email) {
          const accountData: any = {};
          if (user.email) {
            accountData.email = user.email.toLowerCase();
          }
          if (accountDoc.exists()) {
            // Merge existing data
            const existing = accountDoc.data();
            accountData.favoriteExercises = existing.favoriteExercises || [];
            accountData.trackedExercises = existing.trackedExercises || [];
          }
          await setDoc(accountRef, accountData, { merge: true });
          await persistEmailIndex();
        }
        
        if (accountDoc.exists()) {
          const data = accountDoc.data();
          return data.trackedExercises || [];
        }
        return [];
      } catch (error) {
        console.error("Error getting tracked exercises:", error);
        return [];
      }
    },

    async setTrackedExercises(exerciseIds: string[]): Promise<void> {
      const user = auth.currentUser;
      if (!user) throw new Error("No user signed in");

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountData: any = {
          trackedExercises: exerciseIds,
          updatedAt: new Date().toISOString(),
        };
        
        // Ensure email is stored for friend request lookups
        if (user.email) {
          accountData.email = user.email.toLowerCase();
        }
        
        await setDoc(accountRef, accountData, { merge: true });
          await persistEmailIndex();
      } catch (error) {
        console.error("Error setting tracked exercises:", error);
        throw error;
      }
    },

    async toggleTrackedExercise(exerciseId: string): Promise<boolean> {
      const user = auth.currentUser;
      if (!user) throw new Error("No user signed in");

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        
        const currentTracked = accountDoc.exists() 
          ? (accountDoc.data().trackedExercises || [])
          : [];
        
        const isTracked = currentTracked.includes(exerciseId);
        const newTracked = isTracked
          ? currentTracked.filter((id: string) => id !== exerciseId)
          : [...currentTracked, exerciseId];

        const accountData: any = {
          trackedExercises: newTracked,
          updatedAt: new Date().toISOString(),
        };
        
        // Ensure email is stored for friend request lookups
        if (user.email) {
          accountData.email = user.email.toLowerCase();
        }

        await setDoc(accountRef, accountData, { merge: true });
          await persistEmailIndex();

        return !isTracked;
      } catch (error) {
        console.error("Error toggling tracked exercise:", error);
        throw error;
      }
    },

    async getUsername(): Promise<string | null> {
      const user = auth.currentUser;
      if (!user) return null;

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        
        if (accountDoc.exists()) {
          const data = accountDoc.data();
          return data.username || null;
        }
        return null;
      } catch (error) {
        console.error("Error getting username:", error);
        return null;
      }
    },

    async setUsername(username: string): Promise<void> {
      const user = auth.currentUser;
      if (!user) throw new Error("No user signed in");

      // Validate username (alphanumeric, underscore, hyphen, 3-20 chars)
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        throw new Error("Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens");
      }

      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
        const accountDoc = await getDoc(accountRef);
        const previous = accountDoc.exists() ? accountDoc.data()?.username : undefined;

        await claimUsername(db, user.uid, username);

        if (typeof previous === "string" && previous.toLowerCase() !== username.trim().toLowerCase()) {
          await deleteUsernameIndex(db, previous);
        }

        const accountData: any = {
          username: username.trim(),
          updatedAt: new Date().toISOString(),
        };
        
        if (user.email) {
          accountData.email = user.email.toLowerCase();
        }

        await setDoc(accountRef, accountData, { merge: true });
        await persistEmailIndex();
      } catch (error) {
        console.error("Error setting username:", error);
        throw error;
      }
    },

    async getUsernameForUser(userId: string): Promise<string | null> {
      try {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, userId);
        const accountDoc = await getDoc(accountRef);
        
        if (accountDoc.exists()) {
          const data = accountDoc.data();
          return data.username || null;
        }
        return null;
      } catch (error) {
        console.error("Error getting username for user:", error);
        return null;
      }
    },
  };
}
