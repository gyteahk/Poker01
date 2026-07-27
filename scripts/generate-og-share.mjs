import { copyFileSync, mkdirSync } from "fs";
import sharp from "sharp";

const W = 1200;
const H = 630;

const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#063A44"/>
      <stop offset="55%" stop-color="#0A6B78"/>
      <stop offset="100%" stop-color="#00C2D7"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="160" fill="#FF4DA6" fill-opacity="0.22"/>
  <circle cx="80" cy="560" r="140" fill="#FF6B4A" fill-opacity="0.2"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#021018" fill-opacity="0.42"/>
  <g font-family="Segoe UI, Microsoft JhengHei, PingFang TC, sans-serif" fill="#fff" text-anchor="middle">
    <text x="600" y="200" font-size="72" font-weight="900" letter-spacing="4">POKER01</text>
    <text x="600" y="290" font-size="42" font-weight="700">一站式 Poker 資訊站</text>
    <text x="600" y="370" font-size="28" font-weight="600" fill="#B8F4F8">迷你遊戲 · 時事快睇 · Poker 小百科</text>
    <text x="600" y="430" font-size="26" font-weight="600" fill="#E8FFFB">輕鬆玩、玩住學 · Play light. Learn as you go.</text>
    <text x="600" y="520" font-size="36" font-weight="800">poker01.club</text>
  </g>
</svg>`);

mkdirSync("public", { recursive: true });
mkdirSync("marketing", { recursive: true });
await sharp(svg).png().toFile("public/og-share.png");
copyFileSync("public/og-share.png", "marketing/og-share-1200x630.png");
const m = await sharp("public/og-share.png").metadata();
console.log("ok", `${m.width}x${m.height}`);
