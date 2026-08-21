import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit as limitFn } from "firebase/firestore";
import { Day } from "./days";
import { createDayService } from "./days";
import { createFriendsService } from "./friends";
import { Timestamp } from "firebase/firestore";
import { normalizeDateToYYYYMMDD } from "./days";

/**
 * Fetch days for current user and all friends
 * Groups days by userId for leaderboard calculations
 * 
 * Note: This requires Firestore rules to allow reading friends' days.
 * The rules should allow reading days where userId is a friend.
 */
export async function fetchDaysForLeaderboard(
  db: Firestore,
  auth: Auth
): Promise<Record<string, Day[]>> {
  const dayService = createDayService(db, auth);
  const friendsService = createFriendsService(db, auth);

  // Get current user ID
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error("Not signed in");
  }

  // Get friends list
  const friends = await friendsService.listFriends();
  
  // Extract friend user IDs (bidirectional - need to get the other user's ID from each friendship)
  const friendUserIds = new Set<string>();
  friends.forEach((f) => {
    // Add the other user's ID (not the current user)
    if (f.userId === currentUserId) {
      friendUserIds.add(f.friendUserId);
    } else if (f.friendUserId === currentUserId) {
      friendUserIds.add(f.userId);
    }
  });

  // Fetch days for all users - initialize with empty arrays for all friends
  const daysByUser: Record<string, Day[]> = {};
  
  // Initialize current user with empty array (will be populated)
  daysByUser[currentUserId] = [];
  
  // Initialize all friends with empty arrays (will be populated if they have days)
  friendUserIds.forEach((friendId) => {
    daysByUser[friendId] = [];
  });

  const daysCol = collection(db, "days");

  const mapFriendDays = (snapshot: Awaited<ReturnType<typeof getDocs>>): Day[] =>
    snapshot.docs.map((docSnap) => {
      const data: any = docSnap.data();
      const dateStr =
        typeof data.date === "string"
          ? data.date
          : normalizeDateToYYYYMMDD(data.date || new Date());

      return {
        id: docSnap.id,
        userId: data.userId,
        date: dateStr,
        isRestDay: data.isRestDay,
        exercises: Array.isArray(data.exercises) ? data.exercises : [],
        notes: data.notes,
        status: data.status === "injured" ? "injured" : undefined,
        importId: typeof data.importId === "string" ? data.importId : undefined,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
      };
    });

  const currentUserPromise = dayService
    .listDays({ limit: 1000, order: "desc" })
    .then((days) => {
      daysByUser[currentUserId] = days;
    })
    .catch((error) => {
      console.warn(`Could not fetch days for current user:`, error);
    });

  const friendPromises = Array.from(friendUserIds).map(async (userId) => {
    try {
      const snapshot = await getDocs(
        query(daysCol, where("userId", "==", userId), orderBy("date", "desc"), limitFn(1000))
      );
      daysByUser[userId] = mapFriendDays(snapshot);
    } catch (error) {
      console.warn(`Could not fetch days for user ${userId}:`, error);
    }
  });

  await Promise.all([currentUserPromise, ...friendPromises]);
  return daysByUser;
}

/**
 * Helper to group days by userId from a flat array
 * Useful when you have days from multiple users already fetched
 */
export function groupDaysByUserId(days: Day[]): Record<string, Day[]> {
  const grouped: Record<string, Day[]> = {};

  for (const day of days) {
    if (!grouped[day.userId]) {
      grouped[day.userId] = [];
    }
    grouped[day.userId].push(day);
  }

  return grouped;
}
