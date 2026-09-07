import { ACHIEVEMENT_BY_ID } from "@liftledger/shared";
import { toast } from "./toast";

/** Celebrate newly persisted catalog medals after syncEarnedAchievements. */
export function notifyMedalUnlocks(added: string[], options?: { delayMs?: number }): void {
  const defs = added
    .map((id) => ACHIEVEMENT_BY_ID[id])
    .filter((def): def is NonNullable<typeof def> => Boolean(def));
  if (defs.length === 0) return;

  const delayMs = options?.delayMs ?? 700;
  window.setTimeout(() => {
    if (defs.length === 1) {
      toast.medal(defs[0].title, defs[0].description, 5500);
      return;
    }
    toast.medal(
      `${defs.length} medals unlocked`,
      defs.map((def) => def.title).join(" · "),
      6500
    );
  }, delayMs);
}
