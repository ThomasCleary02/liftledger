import {
  autoFeatureNewUnlocks,
  calculateCurrentStreakFromDays,
  calculateLongestStreakFromDays,
  calculateTotalVolumeFromDays,
  evaluateEarnedIds,
  mergeNewlyEarned,
  type AchievementProgress,
  type Day,
} from "@liftledger/shared";
import { accountService } from "./firebase";
import { listDays } from "./firestore/days";
import { daysListIsComplete, peekDaysArray } from "./sessionCache";

export async function syncEarnedAchievements(days?: Day[]): Promise<{
  progress: AchievementProgress;
  added: string[];
}> {
  const history =
    days ?? (daysListIsComplete() ? peekDaysArray() : await listDays({ limit: 2000, order: "desc" }));
  const current = await accountService.getAchievementProgress();
  const { next, added } = mergeNewlyEarned(
    current.earned,
    evaluateEarnedIds(history),
    new Date().toISOString()
  );
  const progress: AchievementProgress = {
    earned: next,
    featuredIds: autoFeatureNewUnlocks(current.featuredIds, added, next),
    stats: {
      currentStreak: calculateCurrentStreakFromDays(history),
      longestStreak: calculateLongestStreakFromDays(history),
      loggedDays: history.filter((day) => day.exercises.length > 0 && day.status !== "injured").length,
      volumeLbs: Math.round(calculateTotalVolumeFromDays(history)),
    },
  };
  const unchanged =
    added.length === 0 &&
    JSON.stringify(current.featuredIds) === JSON.stringify(progress.featuredIds) &&
    JSON.stringify(current.stats) === JSON.stringify(progress.stats) &&
    JSON.stringify(current.earned) === JSON.stringify(progress.earned);
  if (!unchanged) {
    const latestPins = (await accountService.getAchievementProgress()).featuredIds;
    progress.featuredIds = autoFeatureNewUnlocks(latestPins, added, next);
    await accountService.setAchievementProgress(progress);
  }
  return { progress, added };
}
