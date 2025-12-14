import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import {
  Timestamp,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

const COLLECTION = "friends";
const ACCOUNTS_COLLECTION = "accounts";

// --------- Types ---------
export interface Friend {
  id: string;
  userId: string; // owner
  friendUserId: string; // friend
  createdAt: Timestamp;
}

export interface FriendWithEmail extends Friend {
  friendEmail?: string; // Optional: populated when fetching friend details
}

// Firestore doc shape
type FriendDoc = {
  userId: string;
  friendUserId: string;
  createdAt: Timestamp;
};

/**
 * Generate friend document ID: ${userId}_${friendUserId}
 * This ensures uniqueness and allows efficient queries
 */
function generateFriendId(userId: string, friendUserId: string): string {
  // Sort IDs to ensure consistent ordering (prevent duplicates)
  const [id1, id2] = [userId, friendUserId].sort();
  return `${id1}_${id2}`;
}


// Export a factory function that creates service functions
export function createFriendsService(db: Firestore, auth: Auth) {
  // --------- Converter ---------
  const converter = {
    toFirestore(data: FriendDoc): FriendDoc {
      return data;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): FriendDoc {
      const data: any = snap.data(options);
      return {
        userId: typeof data?.userId === "string" ? data.userId : "",
        friendUserId: typeof data?.friendUserId === "string" ? data.friendUserId : "",
        createdAt: data?.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      };
    },
  };

  // --------- Collection refs ---------
  const friendsCol = collection(db, COLLECTION).withConverter<FriendDoc>(converter);
  const friendDoc = (id: string) => doc(db, COLLECTION, id).withConverter<FriendDoc>(converter);

  // --------- CRUD Operations ---------
  return {
    /**
     * List all friends for the current user
     * Queries both directions: where userId == uid OR friendUserId == uid
     */
    async listFriends(): Promise<Friend[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Query where current user is the owner
      const q1 = query(friendsCol, where("userId", "==", uid));
      const res1 = await getDocs(q1);
      
      // Query where current user is the friend (bidirectional)
      const q2 = query(friendsCol, where("friendUserId", "==", uid));
      const res2 = await getDocs(q2);

      // Combine and deduplicate (shouldn't be duplicates, but just in case)
      const friendMap = new Map<string, Friend>();
      
      res1.docs.forEach((d) => {
        const data = d.data();
        friendMap.set(d.id, {
          id: d.id,
          userId: data.userId,
          friendUserId: data.friendUserId,
          createdAt: data.createdAt,
        });
      });

      res2.docs.forEach((d) => {
        const data = d.data();
        // Only add if not already in map
        if (!friendMap.has(d.id)) {
          friendMap.set(d.id, {
            id: d.id,
            userId: data.userId,
            friendUserId: data.friendUserId,
            createdAt: data.createdAt,
          });
        }
      });

      return Array.from(friendMap.values());
    },

    /**
     * Add a friend by email address
     * Looks up the user by email in the accounts collection
     */
    async addFriendByEmail(email: string): Promise<Friend> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.includes("@")) {
        throw new Error("Invalid email address");
      }

      // Find user by email in accounts collection
      // Note: This requires email to be stored in accounts collection
      const accountsCol = collection(db, ACCOUNTS_COLLECTION);
      const accountsQuery = query(accountsCol, where("email", "==", normalizedEmail));
      const accountsSnapshot = await getDocs(accountsQuery);

      if (accountsSnapshot.empty) {
        throw new Error("No user found with that email address");
      }

      const friendAccount = accountsSnapshot.docs[0];
      const friendUserId = friendAccount.id;

      // Prevent adding yourself as a friend
      if (friendUserId === uid) {
        throw new Error("Cannot add yourself as a friend");
      }

      // Check if friendship already exists using queries (rule-safe)
      const q1 = query(
        friendsCol,
        where("userId", "==", uid),
        where("friendUserId", "==", friendUserId)
      );
      const q2 = query(
        friendsCol,
        where("userId", "==", friendUserId),
        where("friendUserId", "==", uid)
      );
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);
      if (!snapshot1.empty || !snapshot2.empty) {
        throw new Error("This user is already your friend");
      }

      // Create friend relationship
      // Generate friend ID using sorted IDs (ensures uniqueness)
      const friendId = generateFriendId(uid, friendUserId);
      const now = Timestamp.now();

      const payload: FriendDoc = {
        userId: uid,
        friendUserId: friendUserId,
        createdAt: now,
      };

      await setDoc(friendDoc(friendId), payload);

      // Return the created friend
      const created = await getDoc(friendDoc(friendId));
      if (!created.exists()) {
        throw new Error("Failed to create friend relationship");
      }

      const data = created.data()!;
      return {
        id: created.id,
        userId: data.userId,
        friendUserId: data.friendUserId,
        createdAt: data.createdAt,
      };
    },

    /**
     * Remove a friend
     * Uses queries to find the document, then deletes it
     */
    async removeFriend(friendUserId: string): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Query where current user is userId and friendUserId matches
      const q1 = query(
        friendsCol,
        where("userId", "==", uid),
        where("friendUserId", "==", friendUserId)
      );
      
      // Query where current user is friendUserId and userId matches (reverse direction)
      const q2 = query(
        friendsCol,
        where("userId", "==", friendUserId),
        where("friendUserId", "==", uid)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      // Find the document to delete (should only be one)
      const docToDelete = snapshot1.docs[0] || snapshot2.docs[0];
      if (!docToDelete) {
        throw new Error("Friend relationship not found");
      }

      await deleteDoc(docToDelete.ref);
    },

    /**
     * Check if a friend relationship exists
     * Uses queries instead of getDoc() for rule compatibility
     */
    async friendExists(friendUserId: string): Promise<boolean> {
      const uid = auth.currentUser?.uid;
      if (!uid) return false;

      // Query where current user is userId and friendUserId matches
      const q1 = query(
        friendsCol,
        where("userId", "==", uid),
        where("friendUserId", "==", friendUserId)
      );
      
      // Query where current user is friendUserId and userId matches (reverse direction)
      const q2 = query(
        friendsCol,
        where("userId", "==", friendUserId),
        where("friendUserId", "==", uid)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      return !snapshot1.empty || !snapshot2.empty;
    },

    /**
     * Get friend IDs list (for use in queries)
     */
    async getFriendIds(): Promise<string[]> {
      const friends = await this.listFriends();
      return friends.map((f) => f.friendUserId);
    },
  };
}
