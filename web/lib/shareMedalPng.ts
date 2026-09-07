import { format } from "date-fns";
import type { AchievementDef } from "@liftledger/shared";
import { achievementTierLabel } from "@liftledger/shared";
import { deliverSharePng, type SharePngResult } from "./sharePng";

const TIER_COLORS: Record<1 | 2 | 3, { outer: string; inner: string; text: string }> = {
  1: { outer: "#a56b32", inner: "#d6a15c", text: "#fff8eb" },
  2: { outer: "#64748b", inner: "#e2e8f0", text: "#0f172a" },
  3: { outer: "#b45309", inner: "#fbbf24", text: "#3f2a08" },
};

function buildMedalCanvas(input: {
  title: string;
  description: string;
  tier: AchievementDef["tier"];
  earnedAt: string;
  username?: string | null;
}): { canvas: HTMLCanvasElement; filename: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw image");

  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, "#0f1410");
  grad.addColorStop(1, "#1a241c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(125, 186, 138, 0.12)";
  for (let y = 80; y < 1080; y += 32) {
    ctx.fillRect(0, y, 1080, 1);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px system-ui, sans-serif";
  ctx.fillText("LiftLedger", 80, 120);
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(input.username ? `@${input.username.replace(/^@/, "")}` : "Medal earned", 80, 168);

  const colors = TIER_COLORS[input.tier];
  const cx = 540;
  const cy = 430;
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.fillStyle = colors.outer;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 132, 0, Math.PI * 2);
  ctx.fillStyle = colors.inner;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  ctx.fillStyle = colors.text;
  ctx.font = "700 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(achievementTierLabel(input.tier).toUpperCase(), cx, cy + 14);
  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(input.title, 80, 700);
  ctx.font = "400 30px system-ui, sans-serif";
  ctx.fillStyle = "#c4c4c4";
  wrapText(ctx, input.description, 80, 760, 920, 40);
  ctx.fillStyle = "#7dba8a";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(`Earned ${format(new Date(input.earnedAt), "MMM d, yyyy")}`, 80, 980);

  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "medal";
  return { canvas, filename: `liftledger-medal-${slug}.png` };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function shareMedalPng(input: {
  title: string;
  description: string;
  tier: AchievementDef["tier"];
  earnedAt: string;
  username?: string | null;
}): Promise<SharePngResult> {
  const { canvas, filename } = buildMedalCanvas(input);
  return deliverSharePng(canvas, filename, {
    title: "LiftLedger",
    text: `I earned ${input.title} on LiftLedger`,
  });
}
