export type PlateSide = { weight: number; count: number };

export type PlatePlan = {
  bar: number;
  perSide: PlateSide[];
  remainder: number;
};

const LB_BAR = 45;
const KG_BAR = 20;
const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export function looksLikeBarbell(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  if (/\b(db|dumbbell|kettlebell|kb|machine|cable|smith|band)\b/.test(n)) return false;
  return /\b(barbell|bb|squat|deadlift|bench|ohp|overhead|press|row|clean|snatch|rdl|good morning)\b/.test(n);
}

export function platesForBar(total: number, unit: "lb" | "kg"): PlatePlan | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  const bar = unit === "kg" ? KG_BAR : LB_BAR;
  const plates = unit === "kg" ? KG_PLATES : LB_PLATES;
  if (total + 0.01 < bar) return null;
  let leftover = (total - bar) / 2;
  const perSide: PlateSide[] = [];
  for (let i = 0; i < plates.length; i++) {
    const plate = plates[i];
    const count = Math.floor((leftover + 0.001) / plate);
    if (count > 0) {
      perSide.push({ weight: plate, count });
      leftover -= count * plate;
    }
  }
  return { bar, perSide, remainder: Math.max(0, leftover * 2) };
}

export function formatPlatePlan(plan: PlatePlan, unit: "lb" | "kg"): string {
  const bar = `${plan.bar} ${unit} bar`;
  if (plan.perSide.length === 0) {
    return plan.remainder > 0.2 ? `${bar} + leftover` : bar;
  }
  const sides = plan.perSide
    .map((plate) => (plate.count === 1 ? `${plate.weight}` : `${plate.count}×${plate.weight}`))
    .join(" + ");
  const extra = plan.remainder > 0.2 ? ` + ${Math.round(plan.remainder * 10) / 10} leftover` : "";
  return `${bar} + ${sides}/side${extra}`;
}
