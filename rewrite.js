import fs from "fs";
import { load } from "cheerio";

const SOURCE_URL = "https://dashboard.accessibe.com/app/remediation-report/b1a50087-9cd3-4b97-b0f1-938f95385346";
const OUTPUT_FILE = "out.html";

const NEW_LOGO_HTML = `
<img src="./logo.png"
     style="width:200px;" />
`;
const res = await fetch(SOURCE_URL);
const html = await res.text();

// Load HTML
const $ = load(html);

// Replace SVG logo
const logo = $('svg[aria-label="accessiBe logo"]');

if (!logo.length) {
  console.error("❌ Logo not found");
  process.exit(1);
}

logo.replaceWith(NEW_LOGO_HTML);

// Write result
fs.writeFileSync(OUTPUT_FILE, $.html(), "utf8");
console.log("✅ Wrote modified HTML to", OUTPUT_FILE);