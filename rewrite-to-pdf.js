import { chromium } from "playwright";

// const SOURCE_URL =
//   "https://dashboard.accessibe.com/app/remediation-report/b1a50087-9cd3-4b97-b0f1-938f95385346";

const SOURCE_URL = process.argv[2];

const OUTPUT_PDF = "report.pdf";

const NEW_LOGO_HTML = `
<img
  src="https://cdn.prod.website-files.com/677c70d437d84025e9c2d9aa/677c71fa78bf1edc66681c6e_selmalogopng%20(1)-p-800.png"
  data-new-logo="true"
  style="width:200px;"
/>
`;

(async () => {
  console.log("🚀 Launching browser");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // -------- diagnostics --------
//   page.on("console", (msg) =>
//     console.log(`🖥️ PAGE [${msg.type()}]: ${msg.text()}`)
//   );
  page.on("pageerror", (err) =>
    console.error("💥 PAGE ERROR:", err)
  );

  console.log("🌍 Navigating to report…");

  await page.goto(SOURCE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("✅ DOM content loaded");

// -------- cookie banner (best effort) --------
try {
    await page.waitForSelector("#usercentrics-root", {
      state: "attached",
      timeout: 5000,
    });

    //await page.waitForTimeout(2500);

    await page.waitForFunction(() => {
        return (
          document
            .querySelector("#usercentrics-root")
            ?.shadowRoot
            ?.querySelector('[data-testid="uc-deny-all-button"]')
        );
      }, { timeout: 3000 });
  
    await page.evaluate(() => {
      document
        .querySelector("#usercentrics-root")
        ?.shadowRoot
        ?.querySelector('[data-testid="uc-deny-all-button"]')
        ?.click();
    });
  
    await page.waitForTimeout(300);
  } catch {}

  // -------- wait for original logo --------
  console.log("🔍 Waiting for original logo…");

  await page.waitForSelector(
    'svg[aria-label="accessiBe logo"]',
    { timeout: 20000 }
  );

  console.log("✅ Original logo found");

  // -------- replace logo --------
  console.log("🎨 Replacing logo…");

  const replaced = await page.evaluate((newLogoHtml) => {
    const original = document.querySelector(
      'svg[aria-label="accessiBe logo"]'
    );

    if (!original) return false;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = newLogoHtml.trim();

    original.replaceWith(wrapper.firstElementChild);
    return true;
  }, NEW_LOGO_HTML);

  if (!replaced) {
    throw new Error("Logo replacement failed");
  }

  console.log("✅ Logo replaced");

  // -------- CRITICAL: wait until *new* logo is fully loaded --------
  console.log("⏳ Waiting for new logo to load…");

  await page.waitForFunction(() => {
    const img = document.querySelector('[data-new-logo="true"]');
    if (!img) return false;
    if (!img.complete || img.naturalWidth === 0) return false;

    const style = window.getComputedStyle(img);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }, { timeout: 15000 });

  console.log("✅ New logo loaded and visible");

  // -------- small settle delay --------
  await page.waitForTimeout(1000);

  // -------- render PDF --------
  console.log("🖨️ Rendering PDF…");

  // -------- hide export button and other elements --------
  await page.evaluate(() => {

    // hide export button
    document
      .querySelector('a[href*="/export"]')
      ?.style.setProperty("display", "none", "important");

    // hide chat
    document
      .querySelector('div[style*="visibility: visible"]')
      ?.style.setProperty("visibility", "hidden", "important");

    // hide summary report image
    document
        .querySelector('svg[aria-label="Illustration"]')
        ?.parentElement
        ?.style.setProperty("display", "none", "important");

    // Hide (resistent) accessibe widget
    const killAccessibe = () => {
        document.querySelectorAll("access-widget-ui").forEach(el => el.remove());
      };
    
      killAccessibe();
    
      new MutationObserver(killAccessibe).observe(document.body, {
        childList: true,
        subtree: true,
      }); 
  });

  await page.addStyleTag({
    content: `
      @media print {
        /* Prevent breaking cards/sections */
        section,
        article,
        .card,
        .panel,
        .report-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
  
        /* Headings should stay with their content */
        h1, h2, h3 {
          page-break-after: avoid;
        }
  
        /* Avoid breaking tables */
        table, tr, td, th {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `,
  });

  await page.pdf({
    path: OUTPUT_PDF,
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  console.log(`💾 PDF saved as ${OUTPUT_PDF}`);

  const pdfPage = await context.newPage();
  await pdfPage.goto(`file://${process.cwd()}/${OUTPUT_PDF}`);

  // await browser.close();
  console.log("🏁 Done");
})();