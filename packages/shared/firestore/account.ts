import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

const WORKOUTS_COLLECTION = "workouts";
const ACCOUNTS_COLLECTION = "accounts";

export function createAccountService(db: Firestore, auth: Auth) {
  return {
    async deleteUserAccount(): Promise<void> {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user signed in");
      }

      try {
        // Delete all workouts
        const workoutsQuery = query(
          collection(db, WORKOUTS_COLLECTION),
          where("ownerId", "==", user.uid)
        );
        const workoutsSnapshot = await getDocs(workoutsQuery);
        
        const deletePromises = workoutsSnapshot.docs.map(docSnapshot => 
          deleteDoc(doc(db, WORKOUTS_COLLECTION, docSnapshot.id))
        );
        
        await Promise.all(deletePromises);

        // Delete account document
        await deleteDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));

        // Delete the auth account
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
        const accountData: any = {
          username: username.trim(),
          updatedAt: new Date().toISOString(),
        };
        
        // Ensure email is stored for friend request lookups
        if (user.email) {
          accountData.email = user.email.toLowerCase();
        }

        await setDoc(accountRef, accountData, { merge: true });
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
