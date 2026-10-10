import { ACHIEVEMENT_BY_ID } from "@liftledger/shared";
import { toast } from "./toast";

/**
 * Celebrate newly persisted catalog medals after syncEarnedAchievements.
 * When `onShareMedal` is provided, a single unlock toast includes a Share action.
 * Profile still auto-opens the detail sheet for the first unlock.
 */
export function notifyMedalUnlocks(
  added: string[],
  options?: { delayMs?: number; onShareMedal?: (id: string) => void }
): void {
  const defs = added
    .map((id) => ACHIEVEMENT_BY_ID[id])
    .filter((def): def is NonNullable<typeof def> => Boolean(def));
  if (defs.length === 0) return;

  const delayMs = options?.delayMs ?? 700;
  window.setTimeout(() => {
    if (defs.length === 1) {
      const def = defs[0];
      toast.medal(def.title, def.description, {
        duration: 5500,
        action: options?.onShareMedal
          ? { label: "Share", onClick: () => options.onShareMedal?.(def.id) }
          : undefined,
      });
      return;
    }
    toast.medal(
      `${defs.length} medals unlocked`,
      defs.map((def) => def.title).join(" · "),
      {
        duration: 6500,
        action: options?.onShareMedal
          ? { label: "Share", onClick: () => options.onShareMedal?.(defs[0].id) }
          : undefined,
      }
    );
  }, delayMs);
}
