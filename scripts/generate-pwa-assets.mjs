/**
 * Render PWA icons, favicon, and iOS splash screens from the same mark as
 * web/components/BrandMark.tsx (Lucide Dumbbell, cream on brand green).
 *
 *   node scripts/generate-pwa-assets.mjs
 *
 * Uses Playwright's Chromium (already installed for e2e).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BRAND = "rgb(20 83 45)";
const BRAND_FG = "rgb(255 249 240)";
const LAUNCH = "rgb(20 17 14)";
// BrandMark uses strokeWidth 2.25 on Lucide's 24-unit grid.
const STROKE = 2.25;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "web");
const PUBLIC = join(ROOT, "public");

const DUMBBELL_PATHS = [
  "M14.4 14.4 9.6 9.6",
  "M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z",
  "m21.5 21.5-1.4-1.4",
  "M3.9 3.9 2.5 2.5",
  "M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z",
];

function dumbbellSvg(px) {
  const paths = DUMBBELL_PATHS.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${BRAND_FG}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/** Square tile: full-bleed (OS applies its own mask) or rounded like BrandMark. */
function tileHtml(size, { iconRatio, rounded }) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  return `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${BRAND};display:flex;align-items:center;justify-content:center">
${dumbbellSvg(Math.round(size * iconRatio))}
</div></body></html>`;
}

function splashHtml(width, height) {
  const box = Math.round(Math.min(width, height) * 0.22);
  return `<!doctype html><html><body style="margin:0;background:${LAUNCH}">
<div style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center">
<div style="width:${box}px;height:${box}px;border-radius:${Math.round(box * 0.22)}px;background:${BRAND};display:flex;align-items:center;justify-content:center">
${dumbbellSvg(Math.round(box * 0.57))}
</div></div></body></html>`;
}

/** ICO container with PNG-encoded entries (supported by all current browsers). */
function encodeIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function render(page, width, height, html, transparent) {
  await page.setViewportSize({ width, height });
  await page.setContent(html);
  return page.screenshot({ type: "png", omitBackground: transparent, clip: { x: 0, y: 0, width, height } });
}

function write(dest, data) {
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, data);
}

const splashes = [
  [1290, 2796],
  [1179, 2556],
  [1170, 2532],
  [1284, 2778],
  [1242, 2688],
  [1125, 2436],
  [828, 1792],
  [750, 1334],
  [2048, 2732],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

const fullBleed = { iconRatio: 0.58, rounded: false };
for (const [file, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  write(join(PUBLIC, file), await render(page, size, size, tileHtml(size, fullBleed), false));
}
// Maskable: keep the mark inside the 80% safe zone.
write(
  join(PUBLIC, "icon-512-maskable.png"),
  await render(page, 512, 512, tileHtml(512, { iconRatio: 0.44, rounded: false }), false)
);

const favicons = [];
for (const size of [16, 32, 48]) {
  favicons.push({
    size,
    data: await render(page, size, size, tileHtml(size, { iconRatio: 0.66, rounded: true }), true),
  });
}
write(join(ROOT, "app", "favicon.ico"), encodeIco(favicons));

for (const [w, h] of splashes) {
  write(join(PUBLIC, "splash", `${w}x${h}.png`), await render(page, w, h, splashHtml(w, h), false));
}

await browser.close();
console.log("Wrote PWA icons, favicon.ico, and iOS splash images");
