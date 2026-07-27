/**
 * Generate PWA icons from the existing logo.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const candidates = [
    path.join(root, "public", "logo-poker01.png"),
    path.join(root, "public", "logo-poker01-256.png"),
    path.join(root, "public", "favicon-poker01.png"),
  ];
  let src = null;
  for (const c of candidates) {
    if (await exists(c)) {
      src = c;
      break;
    }
  }
  if (!src) throw new Error("No logo source found in public/");

  const base = sharp(src).ensureAlpha();

  await base
    .clone()
    .resize(192, 192, { fit: "cover", position: "centre" })
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  await base
    .clone()
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png()
    .toFile(path.join(outDir, "icon-512.png"));

  // Maskable: add safe padding on dark background
  const inner = await sharp(src)
    .resize(410, 410, { fit: "contain", background: { r: 11, g: 18, b: 32, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 18, b: 32, alpha: 1 },
    },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .png()
    .toFile(path.join(outDir, "icon-512-maskable.png"));

  console.log("PWA icons written to public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
