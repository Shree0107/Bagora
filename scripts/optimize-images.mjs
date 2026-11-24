// Turns the source photos in images/ into optimised WebP files in public/products/.
// Usage: npm run images   (config: scripts/images.config.json)
//
// Product photos become 1600x2000 (4:5) WebP on the warm ivory background:
//   fit "contain" keeps the whole bag and pads with ivory (studio shots),
//   fit "cover"   crops to fill the frame (lifestyle / detail shots).
// Next.js <Image> then serves smaller AVIF/WebP sizes to each device and lazy-loads them.
import { readFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const config = JSON.parse(await readFile(path.join(root, "scripts/images.config.json"), "utf8"));
const outDir = path.join(root, "public/products");
await mkdir(outDir, { recursive: true });

const kb = (n) => `${Math.round(n / 1024)} KB`;
let failed = 0;

for (const item of config.images) {
  const src = path.join(root, item.src);
  const out = path.join(outDir, `${item.out}.webp`);
  try {
    await sharp(src)
      .rotate()
      .resize(config.width, config.height, {
        fit: item.fit === "cover" ? "cover" : "contain",
        background: config.background,
        position: item.position ?? "centre",
        withoutEnlargement: false,
      })
      .flatten({ background: config.background })
      .webp({ quality: config.quality, effort: 6 })
      .toFile(out);
    const meta = await sharp(src).metadata();
    const size = (await stat(out)).size;
    const warn = Math.max(meta.width ?? 0, meta.height ?? 0) < 1200 ? "  ⚠ source is small (upscaled), replace with a higher-res photo" : "";
    console.log(`✓ ${item.out}.webp  ${meta.width}x${meta.height} -> ${config.width}x${config.height}  ${kb(size)}${warn}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${item.src}: ${err.message}`);
  }
}

for (const item of config.extras ?? []) {
  const out = path.join(outDir, `${item.out}.webp`);
  try {
    await sharp(path.join(root, item.src))
      .rotate()
      .resize({ width: item.maxWidth ?? 2400, withoutEnlargement: true })
      .webp({ quality: config.quality, effort: 6 })
      .toFile(out);
    console.log(`✓ ${item.out}.webp  ${kb((await stat(out)).size)}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${item.src}: ${err.message}`);
  }
}

if (failed) process.exitCode = 1;
