import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GREEN = [20, 83, 45, 255];
const FG = [255, 249, 240, 255];
const LAUNCH = [20, 17, 14, 255];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "public");

function createImage(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { width, height, data };
}

function setPixel(img, x, y, color) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = color[0];
  img.data[i + 1] = color[1];
  img.data[i + 2] = color[2];
  img.data[i + 3] = color[3];
}

function fillCircle(img, cx, cy, r, color) {
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(img.width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(img.height - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPixel(img, x, y, color);
    }
  }
}

function fillRoundRect(img, x, y, w, h, r, color) {
  const x1 = x + w;
  const y1 = y + h;
  const rad = Math.min(r, w / 2, h / 2);
  for (let py = Math.floor(y); py < Math.ceil(y1); py++) {
    for (let px = Math.floor(x); px < Math.ceil(x1); px++) {
      const cx = Math.min(Math.max(px + 0.5, x + rad), x1 - rad);
      const cy = Math.min(Math.max(py + 0.5, y + rad), y1 - rad);
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      if (dx * dx + dy * dy <= rad * rad) setPixel(img, px, py, color);
    }
  }
}

function drawMark(img, cx, cy, size) {
  const half = size / 2;
  fillRoundRect(img, cx - half, cy - half, size, size, size * 0.18, GREEN);
  const barH = size * 0.11;
  const barW = size * 0.62;
  fillRoundRect(img, cx - barW / 2, cy - barH / 2, barW, barH, barH / 2, FG);
  const plateR = size * 0.16;
  const innerR = size * 0.11;
  const gap = size * 0.28;
  fillCircle(img, cx - gap, cy, plateR, FG);
  fillCircle(img, cx + gap, cy, plateR, FG);
  fillCircle(img, cx - gap * 0.72, cy, innerR, FG);
  fillCircle(img, cx + gap * 0.72, cy, innerR, FG);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcSrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcSrc));
  return Buffer.concat([len, crcSrc, crc]);
}

function encodePng(img) {
  const raw = Buffer.alloc((img.width * 4 + 1) * img.height);
  for (let y = 0; y < img.height; y++) {
    const row = y * (img.width * 4 + 1);
    raw[row] = 0;
    img.data.copy(raw, row + 1, y * img.width * 4, (y + 1) * img.width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function writePng(rel, img) {
  const dest = join(ROOT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, encodePng(img));
}

function makeIcon(size, padded) {
  const img = createImage(size, size, GREEN);
  const mark = padded ? size * 0.62 : size;
  drawMark(img, size / 2, size / 2, mark);
  return img;
}

function makeSplash(width, height) {
  const img = createImage(width, height, LAUNCH);
  drawMark(img, width / 2, height / 2, Math.round(Math.min(width, height) * 0.22));
  return img;
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

writePng("icon-192.png", makeIcon(192, false));
writePng("icon-512.png", makeIcon(512, false));
writePng("icon-512-maskable.png", makeIcon(512, true));
writePng("apple-touch-icon.png", makeIcon(180, false));
for (const [w, h] of splashes) {
  writePng(`splash/${w}x${h}.png`, makeSplash(w, h));
}

console.log("Wrote PWA icons and iOS splash images");
