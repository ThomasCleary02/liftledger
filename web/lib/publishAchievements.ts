import {
  buildPublicAchievements,
  type AchievementShareSettings,
  type PublicAchievements,
} from "@liftledger/shared";
import { accountService } from "./firebase";
import { peekDaysArray } from "./sessionCache";

export async function publishPublicAchievements(
  share?: AchievementShareSettings,
  days = peekDaysArray()
): Promise<PublicAchievements | null> {
  const settings = share ?? (await accountService.getAchievementShare());
  if (!settings.enabled) return null;
  const tracked = await accountService.getTrackedExercises();
  const snapshot = buildPublicAchievements(days, tracked, settings);
  await accountService.setAchievementShare(settings, snapshot);
  return snapshot;
}
