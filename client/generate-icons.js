import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Create __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#4F46E5"/>
  <circle cx="256" cy="256" r="80" fill="white"/>
  <circle cx="256" cy="256" r="40" fill="#4F46E5"/>
  <circle cx="256" cy="256" r="16" fill="white"/>
  <circle cx="256" cy="256" r="112" fill="none" stroke="white" stroke-width="16" opacity="0.4"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="white" stroke-width="10" opacity="0.2"/>
</svg>
`);

// Resolve public directory path
const publicDir = path.join(__dirname, "public");

async function generate() {
  // Automatically create the 'public' directory if it doesn't exist yet
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("✓ Created missing 'public' directory");
  }

  // Generate PNGs
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  console.log("✓ icon-192.png created");

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  console.log("✓ icon-512.png created");

  await sharp(svgBuffer).resize(72, 72).png().toFile(path.join(publicDir, "badge-72.png"));
  console.log("✓ badge-72.png created");

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png created");

  console.log("\n🎉 All icons generated successfully!");
}

generate().catch((err) => {
  console.error("❌ An error occurred during generation:", err.message);
});