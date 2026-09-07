import {
  autoFeatureNewUnlocks,
  calculateCurrentStreakFromDays,
  calculateLongestStreakFromDays,
  evaluateEarnedIds,
  isLoggedDay,
  mergeNewlyEarned,
  type AchievementProgress,
  type Day,
} from "@liftledger/shared";
import { accountService } from "./firebase";
import { peekDaysArray } from "./sessionCache";

export async function syncEarnedAchievements(days?: Day[]): Promise<{
  progress: AchievementProgress;
  added: string[];
}> {
  const history = days ?? peekDaysArray();
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
      loggedDays: history.filter(isLoggedDay).length,
    },
  };
  const unchanged =
    added.length === 0 &&
    JSON.stringify(current.featuredIds) === JSON.stringify(progress.featuredIds) &&
    JSON.stringify(current.stats) === JSON.stringify(progress.stats) &&
    JSON.stringify(current.earned) === JSON.stringify(progress.earned);
  if (!unchanged) await accountService.setAchievementProgress(progress);
  return { progress, added };
}
