export type ExerciseDisplay = {
  title: string;
  tag: string | null;
};

type EquipmentRule = {
  tag: string;
  match: RegExp;
};

/** Longest / most specific first so "Smith machine" is not tagged Machine. */
const EQUIPMENT_RULES: EquipmentRule[] = [
  { tag: "Smith", match: /\bsmith(\s+machine)?\b/gi },
  { tag: "Treadmill", match: /\btreadmill\b/gi },
  { tag: "Cable", match: /\bcables?\b/gi },
  { tag: "Dumbbell", match: /\bdumbbells?\b/gi },
  { tag: "Machine", match: /\bmachine\b/gi },
];

/**
 * Split a catalog name into a movement title plus an equipment tag.
 * Does not merge exercise IDs or PR math — display only.
 */
export function splitExerciseDisplay(name: string): ExerciseDisplay {
  const original = (name || "").trim();
  if (!original) return { title: "", tag: null };

  for (const rule of EQUIPMENT_RULES) {
    rule.match.lastIndex = 0;
    if (!rule.match.test(original)) continue;
    rule.match.lastIndex = 0;
    const title = original
      .replace(rule.match, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[-–—,:]+|[-–—,:]+$/g, "")
      .trim();
    // Name is only the equipment word (e.g. "Treadmill") — no redundant chip.
    if (!title || title.toLowerCase() === rule.tag.toLowerCase()) {
      return { title: original, tag: null };
    }
    // Treadmill names already say treadmill ("Treadmill Run") — keep full title, no chip.
    if (rule.tag === "Treadmill") {
      return { title: original, tag: null };
    }
    return { title, tag: rule.tag };
  }

  if (/^running$/i.test(original)) return { title: "Run", tag: null };
  return { title: original, tag: null };
}
