import { format, startOfWeek, addDays } from "date-fns";
import type { Day } from "@liftledger/shared/firestore/days";
import { strengthVolume, toDisplayWeight, type UnitSystem } from "@liftledger/shared";
import { deliverSharePng, type SharePngResult } from "./sharePng";

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

function buildWeekCanvas(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): { canvas: HTMLCanvasElement; filename: string } {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw image");

  const bg = ctx.createLinearGradient(0, 0, 0, 1080);
  bg.addColorStop(0, "#0f1410");
  bg.addColorStop(1, "#1a241c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(125, 186, 138, 0.1)";
  for (let y = 64; y < 1080; y += 32) {
    ctx.fillRect(0, y, 1080, 1);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillText("LiftLedger", 80, 130);
  ctx.font = "400 30px system-ui, sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(username ? `@${username.replace(/^@/, "")}` : "This week", 80, 180);
  ctx.fillStyle = "#7dba8a";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText(
    `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`,
    80,
    230
  );

  let trained = 0;
  let volume = 0;
  dates.forEach((date, index) => {
    const day = byDate.get(date);
    const active = Boolean(day && !day.isRestDay && (day.exercises?.length || 0) > 0);
    if (day && day.exercises) volume += day.exercises.reduce((sum, ex) => sum + strengthVolume(ex.strengthSets), 0);
    if (active) trained += 1;
    const x = 80 + index * 140;
    const y = 340;
    ctx.fillStyle = active ? "#7dba8a" : "#243028";
    roundRect(ctx, x, y, 110, 150, 20);
    ctx.fill();
    if (active) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      roundRect(ctx, x, y, 110, 150, 20);
      ctx.fill();
    }
    ctx.fillStyle = active ? "#0f1410" : "#8a958c";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "EEEEE"), x + 40, y + 52);
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "d"), x + 34, y + 108);
  });

  const volumeLabel = units === "metric" ? "kg" : "lb";
  const volumeDisplay = Math.round(toDisplayWeight(volume, units));
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px system-ui, sans-serif";
  ctx.fillText(`${trained} of 7 days with work`, 80, 620);
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillStyle = "#c4c4c4";
  ctx.fillText(`${volumeDisplay.toLocaleString()} ${volumeLabel} volume`, 80, 680);
  ctx.fillStyle = "#7dba8a";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText("Keep the ledger honest.", 80, 980);

  return { canvas, filename: `liftledger-week-${dates[0]}.png` };
}

export type ShareWeekResult = SharePngResult;

/**
 * Prefer the OS share sheet (iOS/Android PWA), then file download, then image preview.
 * Avoids the no-op flicker from `<a download>` + data URLs on mobile Safari.
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
