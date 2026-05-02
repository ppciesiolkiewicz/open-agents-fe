#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
  bg: "#0a0a0a",
  bg2: "#18181b",
  fg: "#fafafa",
  sub: "#a1a1aa",
  rose: "#fb7185",
  amber: "#fbbf24",
  sky: "#38bdf8",
};

function dots({ cx, cy, r, gap }) {
  const total = r * 6 + gap * 2;
  const startX = cx - total / 2 + r;
  const colors = [COLORS.rose, COLORS.amber, COLORS.sky];
  return colors
    .map(
      (c, i) =>
        `<circle cx="${startX + i * (r * 2 + gap)}" cy="${cy}" r="${r}" fill="${c}"/>`,
    )
    .join("");
}

function logoSVG() {
  const size = 512;
  const fontSize = 140;
  const dotR = 18;
  const dotGap = 18;
  const blockH = fontSize + 40 + dotR * 2;
  const textY = (size - blockH) / 2 + fontSize / 2;
  const dotsY = textY + fontSize / 2 + 40 + dotR;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="96" fill="${COLORS.bg}"/>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" dominant-baseline="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-weight="700" font-size="${fontSize}" fill="${COLORS.fg}"
        letter-spacing="-4">Agora</text>
  ${dots({ cx: size / 2, cy: dotsY, r: dotR, gap: dotGap })}
</svg>`;
}

function coverSVG() {
  const w = 1280;
  const h = 720;
  const fontSize = 220;
  const subSize = 36;
  const dotR = 28;
  const dotGap = 28;
  const textY = h / 2 - 60;
  const dotsY = textY + fontSize / 2 + 60 + dotR;
  const subY = dotsY + dotR + 80;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.bg}"/>
      <stop offset="100%" stop-color="${COLORS.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text x="${w / 2}" y="${textY}" text-anchor="middle" dominant-baseline="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-weight="700" font-size="${fontSize}" fill="${COLORS.fg}"
        letter-spacing="-8">Agora</text>
  ${dots({ cx: w / 2, cy: dotsY, r: dotR, gap: dotGap })}
  <text x="${w / 2}" y="${subY}" text-anchor="middle" dominant-baseline="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-weight="500" font-size="${subSize}" fill="${COLORS.sub}"
        letter-spacing="6">CHAT WITH AGENTS</text>
</svg>`;
}

const targets = [
  { file: "logo.png", svg: logoSVG() },
  { file: "cover.png", svg: coverSVG() },
];

for (const { file, svg } of targets) {
  const path = join(ROOT, file);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(path, png);
  console.log(`wrote ${path}`);
}
