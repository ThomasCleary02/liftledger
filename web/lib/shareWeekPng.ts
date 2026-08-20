import { format, startOfWeek, addDays } from "date-fns";
import type { Day } from "@liftledger/shared/firestore/days";
import { isLoggedDay, strengthVolume } from "@liftledger/shared";

export function downloadWeekSharePng(days: Day[], username?: string | null): void {
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
    const active = day ? isLoggedDay(day) && (!day.isRestDay || (day.exercises?.length || 0) > 0) : false;
    const rest = Boolean(day?.isRestDay && (!day.exercises || day.exercises.length === 0));
    const flag = day?.status;
    if (day && day.exercises) volume += day.exercises.reduce((sum, ex) => sum + strengthVolume(ex.strengthSets), 0);
    if (active || rest || flag) trained += 1;
    const x = 80 + index * 140;
    const y = 360;
    ctx.fillStyle = active ? "#ffffff" : rest || flag ? "#525252" : "#2a2a2a";
    roundRect(ctx, x, y, 110, 140, 18);
    ctx.fill();
    ctx.fillStyle = active ? "#111111" : "#d4d4d4";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "EEEEE"), x + 38, y + 50);
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillText(format(addDays(weekStart, index), "d"), x + 36, y + 100);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText(`${trained} of 7 days`, 80, 620);
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(`${Math.round(volume).toLocaleString()} lb volume`, 80, 680);

  const link = document.createElement("a");
  link.download = `liftledger-week-${dates[0]}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

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
