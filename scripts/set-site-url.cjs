/*
  Sets the production URL used by canonical tags, Open Graph metadata,
  JSON-LD, robots.txt and sitemap.xml.

  Usage:
    node scripts/set-site-url.cjs https://www.your-domain.in
*/
const fs = require("fs");
const path = require("path");

const suppliedUrl = process.argv[2];

if (!suppliedUrl) {
  console.error("Usage: node scripts/set-site-url.cjs https://www.your-domain.in");
  process.exit(1);
}

let origin;
try {
  const parsed = new URL(suppliedUrl);
  if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("Use the HTTPS domain only, without a path, query or hash.");
  }
  origin = parsed.origin;
} catch (error) {
  console.error(`Invalid site URL: ${error.message}`);
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const targets = [
  ...fs.readdirSync(root).filter((file) => file.endsWith(".html")),
  "build.js",
  "robots.txt",
  "sitemap.xml"
];

for (const file of targets) {
  const filePath = path.join(root, file);
  const original = fs.readFileSync(filePath, "utf8");
  const updated = original.replaceAll("https://www.example.com", origin);
  fs.writeFileSync(filePath, updated);
  console.log(`${original === updated ? "checked" : "updated"} ${file}`);
}

console.log(`\nProduction URL configured as ${origin}`);
