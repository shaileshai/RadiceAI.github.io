/**
 * Measures real computed contrast on every text element of every page, so the
 * "meets AA" claim on /accessibility/ is something we checked rather than hoped.
 * WCAG 1.4.3: 4.5:1 for normal text, 3:1 for text >=24px or >=18.66px bold.
 *
 *   docker compose up --build -d
 *   npm run contrast
 *
 * It needs the site served over HTTP, not from dist/ on disk, because the CSS is
 * loaded by absolute path. Two categories are reported separately and only the
 * first is a failure:
 *
 * - FAIL: text over a solid background, where the ratio is exact and binding.
 * - over-gradient: text over the navy gradient bands, where no single background
 *   colour exists to measure against. These are white or near-white on a field
 *   running from #05070e to roughly #2b5da0; the worst case is white on the
 *   lightest stop, which is about 5.4:1. Checked from the screenshots instead.
 *
 * The masthead, mobile menu and consent banner are skipped: they are fixed over
 * whatever is scrolled underneath, so there is no ancestor background to resolve.
 * Their two real states — white on the dark hero, ink on paper once the bar goes
 * opaque — are checked by eye.
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

const CANDIDATES = [
  `${homedir()}/.cache/puppeteer/chrome/mac_arm-152.0.7977.42/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  process.env.CHROME_PATH,
].filter(Boolean);

const CHROME = CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error("contrast: no Chromium found. Set CHROME_PATH and re-run.");
  process.exit(1);
}

const PATHS = [
  "/", "/two-weeks/", "/kit/", "/law/", "/institutions/", "/how-we-work/",
  "/about/", "/contact/", "/privacy/", "/legal/", "/accessibility/", "/nope/",
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const AUDIT = () => {
  const parse = (s) => {
    const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
    return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /* Walk up for the nearest painted background, html included. */
  const bgOf = (el) => {
    let n = el;
    let gradient = false;
    while (n) {
      const s = getComputedStyle(n);
      const c = parse(s.backgroundColor);
      if (s.backgroundImage !== "none") gradient = true;
      if (c.a === 1) return { c, gradient };
      n = n.parentElement;
    }
    return { c: { r: 255, g: 255, b: 255, a: 1 }, gradient };
  };

  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    /*
     * The masthead, mobile menu and consent banner are fixed over whatever
     * happens to be scrolled underneath, so there is no ancestor background to
     * resolve. They are checked against their two real states by hand: white on
     * the dark hero, and ink on paper once the bar has gone opaque.
     */
    if (el.closest(".masthead, .menu, .consent, .skip")) continue;
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!text) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    const size = parseFloat(s.fontSize);
    const weight = Number(s.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;

    const bg = bgOf(el);
    const fg = over(parse(s.color), bg.c);
    const got = ratio(fg, bg.c);

    if (got < need) {
      out.push({
        sel: el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ").filter(Boolean).join(".")}` : ""),
        text: text.slice(0, 48),
        size: Math.round(size),
        got: got.toFixed(2),
        need,
        gradient: bg.gradient,
      });
    }
  }
  return out;
};

let fails = 0;
for (const p of PATHS) {
  await page.goto(`http://localhost:8080${p}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const bad = await page.evaluate(AUDIT);
  const hard = bad.filter((b) => !b.gradient);
  const soft = bad.filter((b) => b.gradient);
  if (hard.length || soft.length) {
    console.log(`\n${p}`);
    for (const b of hard) console.log(`  FAIL ${b.got} (need ${b.need})  ${b.size}px  ${b.sel}  "${b.text}"`);
    for (const b of soft) console.log(`  over-gradient ${b.got} (need ${b.need})  ${b.size}px  ${b.sel}  "${b.text}"`);
  }
  fails += hard.length;
}

console.log(`\n${fails} solid-background contrast failures across ${PATHS.length} pages`);
await browser.close();
process.exit(fails ? 1 : 0);
