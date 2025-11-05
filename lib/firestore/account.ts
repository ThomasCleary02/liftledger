import { auth, db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

const WORKOUTS_COLLECTION = "workouts";

/**
 * Delete all user data and account
 */
export async function deleteUserAccount(): Promise<void> {
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

    // Delete the auth account
    await deleteUser(user);
  } catch (error: any) {
    console.error("Error deleting account:", error);
    throw new Error(error?.message || "Failed to delete account");
  }
}
