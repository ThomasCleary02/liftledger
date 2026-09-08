/**
 * Exercises logged primarily by hold time (seconds), not reps.
 * Used to auto-open hold UI / timer and bias defaults.
 */
const HOLD_FOCUSED =
  /\b(plank|wall\s*sit|hollow(\s*body)?(\s*hold)?|l[\s-]?sit|v[\s-]?sit|dead\s*hang|flexed[\s-]?arm\s*hang|chin[\s-]?up\s*hold|pull[\s-]?up\s*hold|dip\s*hold|handstand(\s*hold)?|bridge\s*hold|isometric|hang\s*hold)\b/i;

export function isHoldFocusedExercise(name: string, exerciseId?: string): boolean {
  const text = `${exerciseId || ""} ${name || ""}`.trim();
  if (!text) return false;
  return HOLD_FOCUSED.test(text);
}

/** Format elapsed hold seconds as m:ss for the live timer. */
export function formatHoldClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
