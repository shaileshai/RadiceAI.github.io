/**
 * Renders the raster assets that crawlers and mobile launchers insist on, using
 * the same headless Chromium the tests already need. Run `npm run icons` after
 * changing the mark or the social-card copy; the output is committed so a build
 * never needs a browser.
 *
 * Produces:
 *   public/apple-touch-icon.png   180×180, iOS home screen
 *   public/icon-512.png           512×512, referenced by site.webmanifest
 *   public/favicon.ico            32×32 PNG wrapped in an ICO container
 *   public/og.png                 1200×630 social card
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public");

/** Whatever Chromium is already on this machine; none of these are dependencies. */
const CANDIDATES = [
  `${homedir()}/.cache/puppeteer/chrome/mac_arm-152.0.7977.42/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  process.env.CHROME_PATH,
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("icons: no Chromium found. Set CHROME_PATH and re-run.");
  process.exit(1);
}

const MARK = (px) => `
  <svg width="${px}" height="${px}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="#f4f4f2" />
    <rect x="7" y="7" width="18" height="18" fill="none" stroke="#0b0d12" stroke-width="2" />
    <rect x="12" y="12" width="8" height="8" fill="#2f6bff" />
  </svg>`;

const page = (inner, css = "") => `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  @font-face { font-family: Geist; src: url("file://${out}/fonts/geist-variable.woff2") format("woff2-variations"); font-weight: 100 900; }
  @font-face { font-family: "Geist Mono"; src: url("file://${out}/fonts/geist-mono-variable.woff2") format("woff2-variations"); font-weight: 100 900; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Geist, sans-serif; -webkit-font-smoothing: antialiased; }
  ${css}
</style></head><body>${inner}</body></html>`;

const OG = page(
  `<div class="card">
     <div class="top">
       <span class="mark"></span>
       <span class="name">Radice</span>
     </div>
     <h1>Own your<br />intelligence.</h1>
     <p class="kicker">Sovereign AI for professional firms and the state</p>
     <div class="rule"></div>
     <p class="foot">Your files. Your hardware. Your model.</p>
   </div>`,
  `
  body { width: 1200px; height: 630px; }
  .card {
    width: 1200px; height: 630px; padding: 72px 80px;
    display: flex; flex-direction: column;
    color: #fff;
    background:
      radial-gradient(110% 95% at 78% 108%, rgba(88,148,236,.45) 0%, transparent 62%),
      linear-gradient(160deg, #05070e 0%, #0a1526 40%, #163870 84%, #2b5da0 100%);
  }
  .top { display: flex; align-items: center; gap: 14px; }
  .mark { width: 26px; height: 26px; border: 2.5px solid #fff; position: relative; }
  .mark::after { content: ""; position: absolute; inset: 5px; background: #2f6bff; }
  .name { font-size: 30px; font-weight: 500; letter-spacing: -.02em; }
  h1 { margin-top: auto; font-size: 118px; line-height: .93; font-weight: 400; letter-spacing: -.035em; }
  .kicker {
    margin-top: 30px; font-family: "Geist Mono", monospace; font-size: 19px;
    font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.62);
  }
  .rule { margin-top: 34px; border-top: 1px dashed rgba(255,255,255,.28); position: relative; }
  .rule::before { content: ""; position: absolute; top: -3px; left: 0; width: 7px; height: 7px; background: #2f6bff; }
  .foot { margin-top: 22px; font-size: 27px; color: rgba(255,255,255,.8); }
`,
);

/** ICO with a single PNG payload — valid, and every current browser reads it. */
const ico = (png) => {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, png]);
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "shell",
  args: ["--no-sandbox", "--allow-file-access-from-files", "--font-render-hinting=none"],
});
const tab = await browser.newPage();

const shoot = async (html, width, height, file) => {
  await tab.setViewport({ width, height, deviceScaleFactor: 1 });
  await tab.setContent(html, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  const buf = await tab.screenshot({ type: "png", omitBackground: false });
  if (file) writeFileSync(resolve(out, file), buf);
  return buf;
};

const square = (px) =>
  page(MARK(px), `body { width: ${px}px; height: ${px}px; } svg { display: block; }`);

await shoot(square(180), 180, 180, "apple-touch-icon.png");
console.log("icons: apple-touch-icon.png");

await shoot(square(512), 512, 512, "icon-512.png");
console.log("icons: icon-512.png");

const small = await shoot(square(32), 32, 32, null);
writeFileSync(resolve(out, "favicon.ico"), ico(small));
console.log("icons: favicon.ico");

await shoot(OG, 1200, 630, "og.png");
console.log("icons: og.png");

await browser.close();

/* Sanity: an OG image under 5 kB means the fonts or gradients did not render. */
const size = readFileSync(resolve(out, "og.png")).length;
if (size < 5000) {
  console.error(`icons: og.png is only ${size} bytes — it probably rendered blank.`);
  process.exit(1);
}
console.log(`icons: og.png ${(size / 1024).toFixed(0)} kB`);
