import { format } from "date-fns";
import type { AchievementDef, AchievementIcon, MedalTier } from "@liftledger/shared";
import { achievementTierLabel, MEDAL_TIER_HEX } from "@liftledger/shared";
import { canvasToBlob, deliverSharePng, type SharePngResult } from "./sharePng";
import { deliverPreparedSharePng, downloadBlob } from "./shareWeekPng";

/** Canvas colors from packages/shared/medalTiers.ts — do not fork hexes here. */
const TIER_COLORS: Record<
  MedalTier,
  { rim: string; face: string; faceDeep: string; text: string; accent: string }
> = {
  1: {
    rim: MEDAL_TIER_HEX[1].rim,
    face: MEDAL_TIER_HEX[1].face,
    faceDeep: MEDAL_TIER_HEX[1].faceDeep,
    text: MEDAL_TIER_HEX[1].text,
    accent: MEDAL_TIER_HEX[1].accent,
  },
  2: {
    rim: MEDAL_TIER_HEX[2].rim,
    face: MEDAL_TIER_HEX[2].face,
    faceDeep: MEDAL_TIER_HEX[2].faceDeep,
    text: MEDAL_TIER_HEX[2].text,
    accent: MEDAL_TIER_HEX[2].accent,
  },
  3: {
    rim: MEDAL_TIER_HEX[3].rim,
    face: MEDAL_TIER_HEX[3].face,
    faceDeep: MEDAL_TIER_HEX[3].faceDeep,
    text: MEDAL_TIER_HEX[3].text,
    accent: MEDAL_TIER_HEX[3].accent,
  },
  4: {
    rim: MEDAL_TIER_HEX[4].rim,
    face: MEDAL_TIER_HEX[4].face,
    faceDeep: MEDAL_TIER_HEX[4].faceDeep,
    text: MEDAL_TIER_HEX[4].text,
    accent: MEDAL_TIER_HEX[4].accent,
  },
  5: {
    rim: MEDAL_TIER_HEX[5].rim,
    face: MEDAL_TIER_HEX[5].face,
    faceDeep: MEDAL_TIER_HEX[5].faceDeep,
    text: MEDAL_TIER_HEX[5].text,
    accent: MEDAL_TIER_HEX[5].accent,
  },
};

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

/** Left-aligned wrapped text. Always resets align so leftover center doesn't clip words off-canvas. */
function fillWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return y;

  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const last = visible[visible.length - 1];
    visible[visible.length - 1] = last.length > 1 ? `${last.replace(/\s+\S*$/, "")}…` : `${last}…`;
  }

  let cursorY = y;
  for (const line of visible) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

/** Minimal filled path icons sized ~72px for the medal face. */
function drawMedalIcon(
  ctx: CanvasRenderingContext2D,
  icon: AchievementIcon,
  cx: number,
  cy: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const s = 1;
  switch (icon) {
    case "zap": {
      ctx.beginPath();
      ctx.moveTo(cx + 6 * s, cy - 34 * s);
      ctx.lineTo(cx - 16 * s, cy + 2 * s);
      ctx.lineTo(cx - 2 * s, cy + 2 * s);
      ctx.lineTo(cx - 10 * s, cy + 34 * s);
      ctx.lineTo(cx + 18 * s, cy - 4 * s);
      ctx.lineTo(cx + 4 * s, cy - 4 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "heart": {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 28 * s);
      ctx.bezierCurveTo(cx - 40 * s, cy + 6 * s, cx - 36 * s, cy - 28 * s, cx - 14 * s, cy - 28 * s);
      ctx.bezierCurveTo(cx - 4 * s, cy - 28 * s, cx, cy - 18 * s, cx, cy - 12 * s);
      ctx.bezierCurveTo(cx, cy - 18 * s, cx + 4 * s, cy - 28 * s, cx + 14 * s, cy - 28 * s);
      ctx.bezierCurveTo(cx + 36 * s, cy - 28 * s, cx + 40 * s, cy + 6 * s, cx, cy + 28 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "trophy": {
      ctx.beginPath();
      ctx.moveTo(cx - 18 * s, cy - 28 * s);
      ctx.lineTo(cx + 18 * s, cy - 28 * s);
      ctx.quadraticCurveTo(cx + 22 * s, cy - 4 * s, cx + 8 * s, cy + 8 * s);
      ctx.lineTo(cx + 8 * s, cy + 16 * s);
      ctx.lineTo(cx + 18 * s, cy + 16 * s);
      ctx.lineTo(cx + 18 * s, cy + 24 * s);
      ctx.lineTo(cx - 18 * s, cy + 24 * s);
      ctx.lineTo(cx - 18 * s, cy + 16 * s);
      ctx.lineTo(cx - 8 * s, cy + 16 * s);
      ctx.lineTo(cx - 8 * s, cy + 8 * s);
      ctx.quadraticCurveTo(cx - 22 * s, cy - 4 * s, cx - 18 * s, cy - 28 * s);
      ctx.closePath();
      ctx.fill();
      // handles
      ctx.beginPath();
      ctx.arc(cx - 22 * s, cy - 14 * s, 10 * s, Math.PI * 0.2, Math.PI * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 22 * s, cy - 14 * s, 10 * s, -Math.PI * 0.2, Math.PI * 0.8, true);
      ctx.stroke();
      break;
    }
    case "dumbbell": {
      ctx.fillRect(cx - 28 * s, cy - 10 * s, 12 * s, 20 * s);
      ctx.fillRect(cx + 16 * s, cy - 10 * s, 12 * s, 20 * s);
      ctx.fillRect(cx - 18 * s, cy - 4 * s, 36 * s, 8 * s);
      ctx.fillRect(cx - 34 * s, cy - 14 * s, 8 * s, 28 * s);
      ctx.fillRect(cx + 26 * s, cy - 14 * s, 8 * s, 28 * s);
      break;
    }
    case "flame": {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 28 * s);
      ctx.bezierCurveTo(cx - 28 * s, cy + 10 * s, cx - 24 * s, cy - 18 * s, cx - 4 * s, cy - 32 * s);
      ctx.bezierCurveTo(cx - 8 * s, cy - 8 * s, cx + 6 * s, cy - 4 * s, cx + 2 * s, cy + 4 * s);
      ctx.bezierCurveTo(cx + 18 * s, cy - 10 * s, cx + 26 * s, cy + 8 * s, cx, cy + 28 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "moon": {
      // Crescent via even-odd: outer disc minus offset disc.
      ctx.beginPath();
      ctx.arc(cx + 2 * s, cy, 28 * s, 0, Math.PI * 2);
      ctx.arc(cx + 14 * s, cy - 6 * s, 22 * s, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      break;
    }
    case "calendar": {
      roundRect(ctx, cx - 26 * s, cy - 22 * s, 52 * s, 48 * s, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(cx - 26 * s, cy - 22 * s, 52 * s, 14 * s);
      ctx.fillStyle = color;
      ctx.fillRect(cx - 14 * s, cy - 30 * s, 6 * s, 14 * s);
      ctx.fillRect(cx + 8 * s, cy - 30 * s, 6 * s, 14 * s);
      break;
    }
    case "target": {
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, 28 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 16 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "medal": {
      ctx.beginPath();
      ctx.moveTo(cx - 14 * s, cy - 8 * s);
      ctx.lineTo(cx - 22 * s, cy - 34 * s);
      ctx.lineTo(cx - 4 * s, cy - 22 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 14 * s, cy - 8 * s);
      ctx.lineTo(cx + 22 * s, cy - 34 * s);
      ctx.lineTo(cx + 4 * s, cy - 22 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 6 * s, 24 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "award": {
      ctx.beginPath();
      ctx.arc(cx, cy - 6 * s, 22 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, cy + 12 * s);
      ctx.lineTo(cx - 16 * s, cy + 34 * s);
      ctx.lineTo(cx, cy + 22 * s);
      ctx.lineTo(cx + 16 * s, cy + 34 * s);
      ctx.lineTo(cx + 10 * s, cy + 12 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "footprints": {
      ctx.beginPath();
      ctx.ellipse(cx - 12 * s, cy + 8 * s, 10 * s, 16 * s, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 12 * s, cy - 8 * s, 10 * s, 16 * s, 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bike": {
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.arc(cx - 16 * s, cy + 10 * s, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 18 * s, cy + 10 * s, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 16 * s, cy + 10 * s);
      ctx.lineTo(cx - 2 * s, cy - 6 * s);
      ctx.lineTo(cx + 14 * s, cy - 6 * s);
      ctx.lineTo(cx + 18 * s, cy + 10 * s);
      ctx.moveTo(cx - 2 * s, cy - 6 * s);
      ctx.lineTo(cx - 8 * s, cy - 18 * s);
      ctx.stroke();
      break;
    }
    case "mountain": {
      ctx.beginPath();
      ctx.moveTo(cx - 30 * s, cy + 22 * s);
      ctx.lineTo(cx - 8 * s, cy - 22 * s);
      ctx.lineTo(cx + 6 * s, cy + 4 * s);
      ctx.lineTo(cx + 14 * s, cy - 10 * s);
      ctx.lineTo(cx + 30 * s, cy + 22 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "person": {
      ctx.beginPath();
      ctx.arc(cx, cy - 18 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8 * s);
      ctx.lineTo(cx, cy + 12 * s);
      ctx.moveTo(cx - 16 * s, cy);
      ctx.lineTo(cx + 16 * s, cy);
      ctx.moveTo(cx, cy + 12 * s);
      ctx.lineTo(cx - 12 * s, cy + 28 * s);
      ctx.moveTo(cx, cy + 12 * s);
      ctx.lineTo(cx + 12 * s, cy + 28 * s);
      ctx.stroke();
      break;
    }
    case "repeat": {
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * s, Math.PI * 0.15, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 18 * s, cy - 14 * s);
      ctx.lineTo(cx + 28 * s, cy - 4 * s);
      ctx.lineTo(cx + 10 * s, cy - 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * s, Math.PI * 1.15, Math.PI * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 18 * s, cy + 14 * s);
      ctx.lineTo(cx - 28 * s, cy + 4 * s);
      ctx.lineTo(cx - 10 * s, cy + 2 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "sparkles": {
      const star = (x: number, y: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * 0.3, y - r * 0.3);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x + r * 0.3, y + r * 0.3);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r * 0.3, y + r * 0.3);
        ctx.lineTo(x - r, y);
        ctx.lineTo(x - r * 0.3, y - r * 0.3);
        ctx.closePath();
        ctx.fill();
      };
      star(cx - 10 * s, cy - 6 * s, 16 * s);
      star(cx + 16 * s, cy + 12 * s, 10 * s);
      break;
    }
    case "timer": {
      ctx.lineWidth = 5 * s;
      ctx.beginPath();
      ctx.arc(cx, cy + 4 * s, 24 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(cx - 8 * s, cy - 30 * s, 16 * s, 8 * s);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4 * s);
      ctx.lineTo(cx, cy - 10 * s);
      ctx.moveTo(cx, cy + 4 * s);
      ctx.lineTo(cx + 12 * s, cy + 12 * s);
      ctx.stroke();
      break;
    }
    case "shield": {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 28 * s);
      ctx.lineTo(cx + 24 * s, cy - 16 * s);
      ctx.lineTo(cx + 20 * s, cy + 8 * s);
      ctx.quadraticCurveTo(cx + 8 * s, cy + 28 * s, cx, cy + 30 * s);
      ctx.quadraticCurveTo(cx - 8 * s, cy + 28 * s, cx - 20 * s, cy + 8 * s);
      ctx.lineTo(cx - 24 * s, cy - 16 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "stairs": {
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, cy + 22 * s);
      ctx.lineTo(cx - 26 * s, cy + 6 * s);
      ctx.lineTo(cx - 8 * s, cy + 6 * s);
      ctx.lineTo(cx - 8 * s, cy - 6 * s);
      ctx.lineTo(cx + 8 * s, cy - 6 * s);
      ctx.lineTo(cx + 8 * s, cy - 18 * s);
      ctx.lineTo(cx + 26 * s, cy - 18 * s);
      ctx.lineTo(cx + 26 * s, cy + 22 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      // Fallback diamond — should not hit if catalog stays typed.
      ctx.beginPath();
      ctx.moveTo(cx, cy - 30 * s);
      ctx.lineTo(cx + 26 * s, cy);
      ctx.lineTo(cx, cy + 30 * s);
      ctx.lineTo(cx - 26 * s, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function kindBadgeLabel(input: Pick<MedalShareInput, "kind" | "window">): string {
  if (input.kind === "challenge" && input.window?.length) {
    return `${input.window.length}d challenge`;
  }
  if (input.kind === "challenge") return "Challenge";
  return "Career medal";
}

function buildMedalCanvas(input: MedalShareInput): { canvas: HTMLCanvasElement; filename: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw image");

  const colors = TIER_COLORS[input.tier];
  const tierLabel = achievementTierLabel(input.tier);
  const kindLabel = kindBadgeLabel(input);

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

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Vertical rhythm: airy top → header → medal hero → copy → footer.
  // Avoid packing brand/chips/disc into the top third while the bottom sits empty.
  const brandY = 128;
  const userY = brandY + 56;
  const chipTop = userY + 40;
  const chipH = 40;
  const cx = 540;
  const cy = 500;
  const discR = 168;
  const faceR = 148;
  const ribbonGap = 24;
  const ribbonH = 44;
  const copyTop = cy + discR + ribbonGap + ribbonH + 48;

  // Brand — dominant header
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px system-ui, sans-serif";
  ctx.fillText("LiftLedger", 80, brandY);
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillStyle = "#a8b5ab";
  ctx.fillText(input.username ? `@${input.username.replace(/^@/, "")}` : "Medal earned", 80, userY);

  // Tier + kind chips
  const tierPill = `${tierLabel.toUpperCase()} · TIER ${input.tier}`;
  ctx.font = "700 22px system-ui, sans-serif";
  const tierPillW = Math.ceil(ctx.measureText(tierPill).width) + 36;
  roundRect(ctx, 80, chipTop, tierPillW, chipH, 12);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.fillStyle = colors.accent;
  ctx.fillText(tierPill, 98, chipTop + 27);

  ctx.font = "700 22px system-ui, sans-serif";
  const kindPillW = Math.ceil(ctx.measureText(kindLabel).width) + 36;
  const kindX = 80 + tierPillW + 12;
  roundRect(ctx, kindX, chipTop, kindPillW, chipH, 12);
  ctx.fillStyle =
    input.kind === "challenge" ? "rgba(125, 186, 138, 0.22)" : "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.fillStyle = input.kind === "challenge" ? "#b8e0c0" : "#c5cfc7";
  ctx.fillText(kindLabel, kindX + 18, chipTop + 27);

  // Medal disc — sits in the visual middle, not jammed under the header
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fillStyle = colors.rim;
  ctx.fill();

  const faceGrad = ctx.createLinearGradient(cx, cy - 150, cx, cy + 150);
  faceGrad.addColorStop(0, colors.face);
  faceGrad.addColorStop(1, colors.faceDeep);
  ctx.beginPath();
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
  ctx.fillStyle = faceGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fill();

  drawMedalIcon(ctx, input.icon, cx, cy, colors.text);

  // Challenge ribbon under disc (or career line for lifetime)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (input.kind === "challenge") {
    const ribbon = kindLabel.toUpperCase();
    ctx.font = "800 24px system-ui, sans-serif";
    const ribbonW = Math.max(220, Math.ceil(ctx.measureText(ribbon).width) + 48);
    const rx = cx - ribbonW / 2;
    const ry = cy + discR + ribbonGap;
    roundRect(ctx, rx, ry, ribbonW, ribbonH, 8);
    ctx.fillStyle = "#7dba8a";
    ctx.fill();
    ctx.fillStyle = "#0c1210";
    ctx.fillText(ribbon, cx, ry + ribbonH / 2 + 1);
  } else {
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillStyle = "#a8b5ab";
    ctx.fillText("Lifetime · Career", cx, cy + discR + ribbonGap + 22);
  }

  // Copy block — title dominates, description secondary; footer follows content
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px system-ui, sans-serif";
  const afterTitle = fillWrappedText(ctx, input.title, 80, copyTop, 920, 58, 2);

  ctx.fillStyle = "#b8c4ba";
  ctx.font = "500 26px system-ui, sans-serif";
  const afterDesc = fillWrappedText(ctx, input.description, 80, afterTitle + 24, 920, 36, 2);

  ctx.fillStyle = "#7dba8a";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText(
    `Earned ${format(new Date(input.earnedAt), "MMM d, yyyy")}`,
    80,
    Math.min(1040, afterDesc + 48)
  );

  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "medal";
  return { canvas, filename: `liftledger-medal-${slug}.png` };
}

export type MedalShareInput = {
  title: string;
  description: string;
  tier: AchievementDef["tier"];
  earnedAt: string;
  username?: string | null;
  /** Challenge vs lifetime — drives ribbon vs career line. */
  kind: AchievementDef["kind"];
  /** Rolling window for challenge medals (e.g. 7d). */
  window?: AchievementDef["window"];
  /** Catalog icon key drawn on the medal face. */
  icon: AchievementIcon;
};

export async function prepareMedalSharePng(
  input: MedalShareInput
): Promise<{ blob: Blob; filename: string; previewUrl: string }> {
  const { canvas, filename } = buildMedalCanvas(input);
  const blob = await canvasToBlob(canvas);
  const previewUrl = URL.createObjectURL(blob);
  return { blob, filename, previewUrl };
}

export { deliverPreparedSharePng, downloadBlob };

export async function shareMedalPng(input: MedalShareInput): Promise<SharePngResult> {
  const { canvas, filename } = buildMedalCanvas(input);
  const kindHint =
    input.kind === "challenge" && input.window?.length
      ? `${input.window.length}d challenge`
      : input.kind === "challenge"
        ? "challenge"
        : "career medal";
  return deliverSharePng(canvas, filename, {
    title: "LiftLedger",
    text: `I earned ${input.title} (${kindHint}) on LiftLedger — ${input.description}`,
  });
}
