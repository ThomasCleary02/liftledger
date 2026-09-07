import { format, startOfWeek, addDays } from "date-fns";
import type { Day } from "@liftledger/shared/firestore/days";
import { strengthVolume, toDisplayWeight, type UnitSystem } from "@liftledger/shared";

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

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillText("LiftLedger", 80, 140);
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(username ? `@${username}` : "This week", 80, 190);

  let trained = 0;
  let volume = 0;
  dates.forEach((date, index) => {
    const day = byDate.get(date);
    const active = Boolean(day && !day.isRestDay && (day.exercises?.length || 0) > 0);
    if (day && day.exercises) volume += day.exercises.reduce((sum, ex) => sum + strengthVolume(ex.strengthSets), 0);
    if (active) trained += 1;
    const x = 80 + index * 140;
    const y = 360;
    ctx.fillStyle = active ? "#ffffff" : "#2a2a2a";
    roundRect(ctx, x, y, 110, 140, 18);
    ctx.fill();
    ctx.fillStyle = active ? "#111111" : "#d4d4d4";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "EEEEE"), x + 38, y + 50);
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "d"), x + 36, y + 100);
  });

  const volumeLabel = units === "metric" ? "kg" : "lb";
  const volumeDisplay = Math.round(toDisplayWeight(volume, units));
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText(`${trained} of 7 days with work`, 80, 620);
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(`${volumeDisplay.toLocaleString()} ${volumeLabel} volume`, 80, 680);

  return { canvas, filename: `liftledger-week-${dates[0]}.png` };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image"));
    }, "image/png");
  });
}

function triggerDownload(blob: Blob, filename: string): void {
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

function openPreview(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    // Stay in the PWA — never navigate the current document to a blob URL.
    URL.revokeObjectURL(url);
    throw new Error("Could not open image preview. Allow pop-ups, or try again from the browser Share sheet.");
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type ShareWeekResult = "shared" | "downloaded" | "previewed";

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
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: "image/png" });

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const canShareFiles = Boolean(
    nav &&
      typeof nav.share === "function" &&
      (typeof nav.canShare !== "function" || nav.canShare({ files: [file] }))
  );

  if (canShareFiles && nav) {
    try {
      await nav.share({
        files: [file],
        title: "LiftLedger",
        text: "My week on LiftLedger",
      });
      return "shared";
    } catch (error) {
      // User dismissed the sheet — not a failure.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
      // Fall through to download / preview.
    }
  }

  // Chromium & desktop: real download. iOS often ignores download — open preview instead.
  const isIos =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  if (!isIos) {
    triggerDownload(blob, filename);
    return "downloaded";
  }

  try {
    openPreview(blob);
    return "previewed";
  } catch {
    // Last resort on iOS without share/preview: still try a download gesture.
    triggerDownload(blob, filename);
    return "downloaded";
  }
}

/** @deprecated Use shareWeekPng — kept for any older imports. */
export function downloadWeekSharePng(
  days: Day[],
  username?: string | null,
  units: UnitSystem = "imperial"
): void {
  void shareWeekPng(days, username, units);
}
