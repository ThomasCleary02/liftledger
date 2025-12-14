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

  // Fetch current user's days using dayService (handles conversion properly)
  try {
    const currentUserDays = await dayService.listDays({ limit: 1000, order: "desc" });
    daysByUser[currentUserId] = currentUserDays;
  } catch (error) {
    console.warn(`Could not fetch days for current user:`, error);
    // Keep empty array
  }

  // For friends, query directly
  const daysCol = collection(db, "days");

  for (const userId of Array.from(friendUserIds)) {
    try {
      // Query days for this friend
      const q = query(
        daysCol,
        where("userId", "==", userId),
        orderBy("date", "desc"),
        limitFn(1000)
      );
      
      const snapshot = await getDocs(q);
      const days: Day[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert date to YYYY-MM-DD string if it's a Timestamp or Date
        const dateStr = typeof data.date === "string" 
          ? data.date 
          : normalizeDateToYYYYMMDD(data.date || new Date());
        
        return {
          id: doc.id,
          userId: data.userId,
          date: dateStr,
          isRestDay: data.isRestDay,
          exercises: Array.isArray(data.exercises) ? data.exercises : [],
          notes: data.notes,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        };
      });

      daysByUser[userId] = days;
    } catch (error) {
      // If we can't read a friend's days (permissions), keep empty array
      console.warn(`Could not fetch days for user ${userId}:`, error);
      // daysByUser[userId] is already initialized as []
    }
  }

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
