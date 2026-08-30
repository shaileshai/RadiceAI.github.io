import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire(
  "/Users/shailesh/Documents/Projects/SLM/tools/canvas-to-pdf/render.mjs",
);
const puppeteer = require("puppeteer");

const dir = new URL("../.preview/", import.meta.url);
await mkdir(dir, { recursive: true });

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

const routes = [
  ["/", "home"],
  ["/two-weeks/", "two-weeks"],
  ["/kit/", "kit"],
  ["/law/", "law"],
  ["/institutions/", "institutions"],
  ["/how-we-work/", "how-we-work"],
];

for (const [route, name] of routes) {
  await page.goto("http://127.0.0.1:4173" + route, {
    waitUntil: "networkidle0",
    timeout: 45000,
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: new URL(`${name}-desktop.png`, dir) });
  console.log("shot", name);
}

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1600));
await page.screenshot({ path: new URL("home-mobile.png", dir) });
await browser.close();
console.log("done");
