import { format, startOfWeek, addDays } from "date-fns";
import type { Day } from "@liftledger/shared/firestore/days";
import {
  calculateTotalCalisthenicsRepsFromDays,
  calculateTotalCardioDurationFromDays,
  strengthVolume,
  toDisplayWeight,
  type UnitSystem,
} from "@liftledger/shared";
import { canvasToBlob, deliverSharePng, type SharePngResult } from "./sharePng";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatDurationShort(seconds: number): string {
  if (!(seconds > 0)) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function buildWeekCanvas(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): { canvas: HTMLCanvasElement; filename: string } {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const weekDays = dates.map((date) => byDate.get(date)).filter(Boolean) as Day[];

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw image");

  const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, "#0c1210");
  bg.addColorStop(0.55, "#152018");
  bg.addColorStop(1, "#1c2a20");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(125, 186, 138, 0.08)";
  for (let y = 48; y < 1080; y += 28) {
    ctx.fillRect(0, y, 1080, 1);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 72px system-ui, sans-serif";
  ctx.fillText("LiftLedger", 80, 120);
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillStyle = "#a8b5ab";
  ctx.fillText(username ? `@${username.replace(/^@/, "")}` : "This week", 80, 170);
  ctx.fillStyle = "#7dba8a";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText(
    `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`,
    80,
    220
  );

  let trained = 0;
  let volume = 0;
  dates.forEach((date, index) => {
    const day = byDate.get(date);
    const active = Boolean(day && !day.isRestDay && (day.exercises?.length || 0) > 0);
    if (day && day.exercises) volume += day.exercises.reduce((sum, ex) => sum + strengthVolume(ex.strengthSets), 0);
    if (active) trained += 1;
    const x = 80 + index * 140;
    const y = 280;
    ctx.fillStyle = active ? "#7dba8a" : "#243028";
    roundRect(ctx, x, y, 110, 150, 22);
    ctx.fill();
    if (active) {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, x, y, 110, 150, 22);
      ctx.fill();
    }
    ctx.fillStyle = active ? "#0f1410" : "#8a958c";
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "EEEEE"), x + 42, y + 48);
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "d"), x + 32, y + 108);
  });

  const volumeLabel = units === "metric" ? "kg" : "lb";
  const volumeDisplay = Math.round(toDisplayWeight(volume, units));
  const cardioSeconds = calculateTotalCardioDurationFromDays(weekDays);
  const caliReps = calculateTotalCalisthenicsRepsFromDays(weekDays);

  const stats: { value: string; label: string }[] = [
    { value: `${trained}/7`, label: "days trained" },
    { value: `${volumeDisplay.toLocaleString()} ${volumeLabel}`, label: "strength volume" },
  ];
  if (cardioSeconds > 0) {
    stats.push({ value: formatDurationShort(cardioSeconds), label: "cardio time" });
  }
  if (caliReps > 0) {
    stats.push({ value: caliReps.toLocaleString(), label: "calisthenics reps" });
  }

  const cardW = stats.length >= 4 ? 220 : 280;
  const gap = 24;
  const totalW = stats.length * cardW + (stats.length - 1) * gap;
  let x0 = Math.max(80, (1080 - totalW) / 2);
  const y0 = 520;

  stats.forEach((stat) => {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x0, y0, cardW, 160, 20);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 40px system-ui, sans-serif";
    ctx.fillText(stat.value, x0 + 20, y0 + 70);
    ctx.fillStyle = "#a8b5ab";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText(stat.label, x0 + 20, y0 + 115);
    x0 += cardW + gap;
  });

  ctx.fillStyle = "#7dba8a";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("Keep the ledger honest.", 80, 980);

  return { canvas, filename: `liftledger-week-${dates[0]}.png` };
}

export type ShareWeekResult = SharePngResult;

export async function prepareWeekSharePng(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): Promise<{ blob: Blob; filename: string; previewUrl: string }> {
  const { canvas, filename } = buildWeekCanvas(days, username, units);
  const blob = await canvasToBlob(canvas);
  const previewUrl = URL.createObjectURL(blob);
  return { blob, filename, previewUrl };
}

export async function deliverPreparedSharePng(
  blob: Blob,
  filename: string
): Promise<ShareWeekResult> {
  const canvas = document.createElement("canvas");
  const img = await createImageBitmap(blob);
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare share image");
  ctx.drawImage(img, 0, 0);
  img.close();
  return deliverSharePng(canvas, filename, {
    title: "LiftLedger",
    text: "My week on LiftLedger",
  });
}

/**
 * Prefer the OS share sheet (iOS/Android PWA), then file download, then preview.
 */
export async function shareWeekPng(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): Promise<ShareWeekResult> {
  const { canvas, filename } = buildWeekCanvas(days, username, units);
  return deliverSharePng(canvas, filename, {
    title: "LiftLedger",
    text: "My week on LiftLedger",
  });
}

/** @deprecated Use shareWeekPng — kept for any older imports. */
export function downloadWeekSharePng(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): void {
  void shareWeekPng(days, username, units);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
