// Generates the VÉRANE icons and social share image from SVG.
// Usage: node scripts/brand-assets.mjs
// Output: src/app/icon.png, src/app/apple-icon.png, src/app/opengraph-image.png, public/brand/verane-wordmark.svg
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const FOREST = "#1F3A2E";
const DEEP = "#16291F";
const GILT = "#C9A96E";
const IVORY = "#F5F1EB";
const SERIF = "'Cormorant Garamond', 'Cormorant', Garamond, Georgia, 'Times New Roman', serif";

const monogram = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${FOREST}"/>
  <rect x="28" y="28" width="456" height="456" fill="none" stroke="${GILT}" stroke-width="4"/>
  <rect x="42" y="42" width="428" height="428" fill="none" stroke="${GILT}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="256" y="350" text-anchor="middle" font-family="${SERIF}" font-size="300" font-weight="500" fill="${GILT}">V</text>
</svg>`;

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FOREST}"/>
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="${GILT}" stroke-width="3"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="${GILT}" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="600" y="300" text-anchor="middle" font-family="${SERIF}" font-size="124" font-weight="500" letter-spacing="38" fill="${GILT}">VÉRANE</text>
  <line x1="470" y1="350" x2="730" y2="350" stroke="${GILT}" stroke-width="1.5"/>
  <text x="600" y="420" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="48" fill="${IVORY}">Véritablement vôtre</text>
  <text x="600" y="480" text-anchor="middle" font-family="Jost, 'Segoe UI', Arial, sans-serif" font-size="22" letter-spacing="6" fill="#B9C4BC">GENUINE LEATHER HANDBAGS · CRAFTED IN INDIA</text>
</svg>`;

const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120">
  <text x="300" y="82" text-anchor="middle" font-family="${SERIF}" font-size="72" font-weight="500" letter-spacing="24" fill="${FOREST}">VÉRANE</text>
</svg>\n`;

await sharp(Buffer.from(monogram(512))).png().toFile(path.join(root, "src/app/icon.png"));
await sharp(Buffer.from(monogram(512))).resize(180, 180).png().toFile(path.join(root, "src/app/apple-icon.png"));
await sharp(Buffer.from(og)).png().toFile(path.join(root, "src/app/opengraph-image.png"));
await mkdir(path.join(root, "public/brand"), { recursive: true });
await writeFile(path.join(root, "public/brand/verane-wordmark.svg"), wordmark);
console.log("✓ icon.png, apple-icon.png, opengraph-image.png, public/brand/verane-wordmark.svg");
void DEEP;
