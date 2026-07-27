/**
 * Generate PWA icons from the existing logo on a white background.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Flatten transparency (and any near-black matte) onto solid white.
 * Source logos often use alpha=0 which otherwise renders as black in PWA splash/icons.
 */
async function whiteCanvasLogo(srcPath) {
  const flattened = await sharp(srcPath)
    .ensureAlpha()
    .flatten({ background: WHITE })
    .png()
    .toBuffer();

  // Also scrub any residual near-black matte that isn't transparent
  const { data, info } = await sharp(flattened)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 28;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png()
    .toBuffer();
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

  const whiteBuf = await whiteCanvasLogo(src);

  await sharp(whiteBuf)
    .resize(192, 192, { fit: "cover", position: "centre", background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  await sharp(whiteBuf)
    .resize(512, 512, { fit: "cover", position: "centre", background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toFile(path.join(outDir, "icon-512.png"));

  const inner = await sharp(whiteBuf)
    .resize(410, 410, {
      fit: "contain",
      background: WHITE,
    })
    .flatten({ background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .flatten({ background: WHITE })
    .png()
    .toFile(path.join(outDir, "icon-512-maskable.png"));

  console.log("PWA icons (white background) written to public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
