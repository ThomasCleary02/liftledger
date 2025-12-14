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
import { createFriendsService } from "./friends";

const COLLECTION = "friendRequests";
const ACCOUNTS_COLLECTION = "accounts";

// --------- Types ---------
export interface FriendRequest {
  id: string;
  fromUserId: string; // requester
  toUserId: string; // recipient
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

// Firestore doc shape
type FriendRequestDoc = {
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  respondedAt?: Timestamp;
};

/**
 * Generate friend request document ID: ${fromUserId}_${toUserId}
 * This ensures uniqueness (one request per pair in one direction)
 */
function generateFriendRequestId(fromUserId: string, toUserId: string): string {
  return `${fromUserId}_${toUserId}`;
}

// Export a factory function that creates service functions
export function createFriendRequestsService(db: Firestore, auth: Auth) {
  // --------- Converter ---------
  const converter = {
    toFirestore(data: FriendRequestDoc): FriendRequestDoc {
      return data;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): FriendRequestDoc {
      const data: any = snap.data(options);
      return {
        fromUserId: typeof data?.fromUserId === "string" ? data.fromUserId : "",
        toUserId: typeof data?.toUserId === "string" ? data.toUserId : "",
        status: data?.status === "pending" || data?.status === "accepted" || data?.status === "rejected"
          ? data.status
          : "pending",
        createdAt: data?.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        respondedAt: data?.respondedAt instanceof Timestamp ? data.respondedAt : undefined,
      };
    },
  };

  // --------- Collection refs ---------
  const requestsCol = collection(db, COLLECTION).withConverter<FriendRequestDoc>(converter);
  const requestDoc = (id: string) => doc(db, COLLECTION, id).withConverter<FriendRequestDoc>(converter);

  // --------- CRUD Operations ---------
  return {
    /**
     * Send a friend request by email
     * Creates a pending request
     */
    async sendFriendRequest(email: string): Promise<FriendRequest> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.includes("@")) {
        throw new Error("Invalid email address");
      }

      // Find user by email in accounts collection
      // Note: Account documents may not have email field stored yet
      // Try querying accounts collection first
      const accountsCol = collection(db, ACCOUNTS_COLLECTION);
      const accountsQuery = query(accountsCol, where("email", "==", normalizedEmail));
      let accountsSnapshot = await getDocs(accountsQuery);

      if (accountsSnapshot.empty) {
        throw new Error(
          "No user found with that email address. " +
          "Make sure the user has signed up and has used the app at least once " +
          "(the account document is created when they first interact with favorites or tracked exercises)."
        );
      }

      const toUserAccount = accountsSnapshot.docs[0];
      const toUserId = toUserAccount.id;

      // Prevent sending request to yourself
      if (toUserId === uid) {
        throw new Error("Cannot send friend request to yourself");
      }

      // Check if friendship already exists
      const friendsService = createFriendsService(db, auth);
      const alreadyFriends = await friendsService.friendExists(toUserId);
      if (alreadyFriends) {
        throw new Error("This user is already your friend");
      }

      // Check if there's already a pending request (in either direction)
      // Query where we sent to them
      const q1 = query(
        requestsCol,
        where("fromUserId", "==", uid),
        where("toUserId", "==", toUserId),
        where("status", "==", "pending")
      );
      
      // Query where they sent to us
      const q2 = query(
        requestsCol,
        where("fromUserId", "==", toUserId),
        where("toUserId", "==", uid),
        where("status", "==", "pending")
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      if (!snapshot1.empty) {
        throw new Error("Friend request already sent");
      }

      if (!snapshot2.empty) {
        throw new Error("This user has already sent you a friend request");
      }

      // Generate request ID and create pending friend request
      const requestId = generateFriendRequestId(uid, toUserId);
      const now = Timestamp.now();
      const payload: FriendRequestDoc = {
        fromUserId: uid,
        toUserId: toUserId,
        status: "pending",
        createdAt: now,
      };

      await setDoc(requestDoc(requestId), payload);

      // Return the created request
      const created = await getDoc(requestDoc(requestId));
      if (!created.exists()) {
        throw new Error("Failed to create friend request");
      }

      const data = created.data()!;
      return {
        id: created.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        status: data.status,
        createdAt: data.createdAt,
        respondedAt: data.respondedAt,
      };
    },

    /**
     * Get pending friend requests sent TO the current user
     */
    async getPendingRequestsToMe(): Promise<FriendRequest[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const q = query(requestsCol, where("toUserId", "==", uid), where("status", "==", "pending"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          status: data.status,
          createdAt: data.createdAt,
          respondedAt: data.respondedAt,
        };
      });
    },

    /**
     * Get pending friend requests sent BY the current user
     */
    async getPendingRequestsFromMe(): Promise<FriendRequest[]> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const q = query(requestsCol, where("fromUserId", "==", uid), where("status", "==", "pending"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          status: data.status,
          createdAt: data.createdAt,
          respondedAt: data.respondedAt,
        };
      });
    },

    /**
     * Accept a friend request
     * Creates the friend relationship and updates the request status
     */
    async acceptFriendRequest(requestId: string): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const requestRef = requestDoc(requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestSnap.data()!;

      // Verify the request is to the current user
      if (requestData.toUserId !== uid) {
        throw new Error("Not authorized to accept this request");
      }

      // Verify the request is still pending
      if (requestData.status !== "pending") {
        throw new Error("This friend request has already been responded to");
      }

      // Create the friend relationship
      // Generate friend ID using sorted IDs (matching friends service)
      const [id1, id2] = [requestData.fromUserId, requestData.toUserId].sort();
      const friendId = `${id1}_${id2}`;
      
      // Check if already exists using queries (rule-safe)
      // Note: We use plain collection here since we're just checking existence
      const friendsCol = collection(db, "friends");
      const q1 = query(
        friendsCol,
        where("userId", "==", id1),
        where("friendUserId", "==", id2)
      );
      const q2 = query(
        friendsCol,
        where("userId", "==", id2),
        where("friendUserId", "==", id1)
      );
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);
      
      if (snapshot1.empty && snapshot2.empty) {
        // Create friend relationship with sorted IDs
        const friendRef = doc(friendsCol, friendId);
        await setDoc(friendRef, {
          userId: id1,
          friendUserId: id2,
          createdAt: Timestamp.now(),
        });
      }

      // Update request status
      await setDoc(requestRef, {
        ...requestData,
        status: "accepted" as const,
        respondedAt: Timestamp.now(),
      });
    },

    /**
     * Reject a friend request
     * Updates the request status to rejected
     */
    async rejectFriendRequest(requestId: string): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const requestRef = requestDoc(requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestSnap.data()!;

      // Verify the request is to the current user
      if (requestData.toUserId !== uid) {
        throw new Error("Not authorized to reject this request");
      }

      // Verify the request is still pending
      if (requestData.status !== "pending") {
        throw new Error("This friend request has already been responded to");
      }

      // Update request status
      await setDoc(requestRef, {
        ...requestData,
        status: "rejected" as const,
        respondedAt: Timestamp.now(),
      });
    },

    /**
     * Cancel a friend request sent by the current user
     */
    async cancelFriendRequest(requestId: string): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const requestRef = requestDoc(requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Friend request not found");
      }

      const requestData = requestSnap.data()!;

      // Verify the request is from the current user
      if (requestData.fromUserId !== uid) {
        throw new Error("Not authorized to cancel this request");
      }

      // Verify the request is still pending
      if (requestData.status !== "pending") {
        throw new Error("Cannot cancel a request that has already been responded to");
      }

      // Delete the request
      await deleteDoc(requestRef);
    },
  };
}
