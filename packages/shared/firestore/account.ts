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
        const accountDoc = await getDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));
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

        await setDoc(accountRef, {
          favoriteExercises: newFavorites,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

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
        const accountDoc = await getDoc(doc(db, ACCOUNTS_COLLECTION, user.uid));
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
        await setDoc(accountRef, {
          trackedExercises: exerciseIds,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
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

        await setDoc(accountRef, {
          trackedExercises: newTracked,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return !isTracked;
      } catch (error) {
        console.error("Error toggling tracked exercise:", error);
        throw error;
      }
    },
  };
}
