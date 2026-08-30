/**
 * The gate between "it builds" and "it is published". `npm test` proves the site
 * is internally consistent; this proves it is fit to be seen by a regulator, a
 * procurement officer, or a partner who reads carefully.
 *
 *   npm run preflight
 *
 * Blockers stop the run. Warnings are printed and do not — they are decisions
 * that are legitimately still open, and the list is meant to be read before each
 * deploy rather than suppressed.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ANALYTICS,
  ENTITY,
  HOSTING,
  ORIGIN,
  analyticsConfigured,
  entityComplete,
} from "../src/config.js";
import { INDEXED, PAGES } from "./pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

const blockers = [];
const warnings = [];
const block = (m) => blockers.push(m);
const warn = (m) => warnings.push(m);

// ---------------------------------------------------------------- build output

if (!existsSync(dist)) {
  block("dist/ does not exist. Run `npm run build` first.");
} else {
  for (const p of PAGES) {
    const file = p.file === "404.html" ? "404.html" : p.file;
    if (!existsSync(resolve(dist, file))) block(`dist/${file} is missing from the build.`);
  }
  for (const asset of [
    "favicon.svg",
    "favicon.ico",
    "apple-touch-icon.png",
    "icon-512.png",
    "og.png",
    "site.webmanifest",
    "robots.txt",
    "sitemap.xml",
    ".nojekyll",
    ".well-known/security.txt",
    "fonts/geist-variable.woff2",
    "fonts/geist-mono-variable.woff2",
    "fonts/LICENSE.txt",
  ]) {
    if (!existsSync(resolve(dist, asset))) block(`dist/${asset} is missing.`);
  }
}

// ---------------------------------------------------------------- legal identity

if (!entityComplete()) {
  const missing = Object.entries(ENTITY)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  block(
    `Provider identification is incomplete: ${missing.join(", ")}. ` +
      "An EU commercial site must identify its operator (e-Commerce Directive Art. 5). " +
      "Fill ENTITY in src/config.js.",
  );
}

// ---------------------------------------------------------------- origin

if (/localhost|127\.0\.0\.1|example\./.test(ORIGIN)) {
  block(`ORIGIN is still ${ORIGIN}. Canonical URLs and the sitemap would be wrong.`);
}
if (!ORIGIN.startsWith("https://")) {
  block(`ORIGIN must be https. It is ${ORIGIN}.`);
}

/*
 * A github.io ORIGIN is a user/organisation site, which GitHub serves only from a
 * repository named exactly <account>.github.io. Push the same code to a project
 * repository and Pages serves it under /repo-name/ instead — every page, asset
 * and font on this site is an absolute path from the root, so all of them 404
 * while the build itself reports success. Worth stating out loud, because the
 * failure looks like a broken site rather than a misnamed repository.
 */
const ghUserSite = ORIGIN.match(/^https:\/\/([a-z0-9-]+)\.github\.io\/?$/i);
if (ghUserSite) {
  warn(
    `ORIGIN is ${ORIGIN}, so the repository must be named exactly ` +
      `${ghUserSite[1]}.github.io and owned by "${ghUserSite[1]}". A project ` +
      "repository would serve the site under a subpath and every absolute link " +
      "would 404. In the repository settings, set Pages → Source to GitHub Actions.",
  );
}

// ---------------------------------------------------------------- analytics

if (analyticsConfigured()) {
  const host = new URL(ANALYTICS.host).hostname;
  if (/plausible\.io|google|umami\.is|matomo\.cloud/.test(host)) {
    warn(
      `Analytics points at ${host}, which is somebody else's server. ` +
        "The privacy notice claims a self-hosted counter — update one or the other.",
    );
  }
} else {
  warn(
    "Analytics is not configured, so no consent banner is shown and nothing is measured. " +
      "This is a valid state; the privacy notice says so.",
  );
}

// ---------------------------------------------------------------- hosting story

if (!HOSTING.inEurope) {
  warn(
    `The site is served by ${HOSTING.provider} in the ${HOSTING.country}. ` +
      "Both /privacy/#hosting and /how-we-work/ say so plainly. " +
      "Set HOSTING.inEurope once that changes, and rewrite those two sections the same day.",
  );
}

// ---------------------------------------------------------------- shipped html

if (existsSync(dist)) {
  const bad = [];
  for (const p of INDEXED) {
    const html = readFileSync(resolve(dist, p.file), "utf8");

    /* Any request off this origin is a data transfer we have not disclosed. */
    const external = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !u.startsWith(ORIGIN));
    if (external.length) bad.push(`${p.file}: external request to ${external.join(", ")}`);

    if (!html.includes(`<link rel="canonical" href="${ORIGIN}${p.path}"`))
      bad.push(`${p.file}: canonical missing or wrong`);
    /*
     * The dev server relaxes style-src and script-src so Vite can inject CSS
     * (see the plugin in vite.config.js). That relaxation must never reach the
     * built output, and dist is the only place a leak would be visible — the
     * source HTML the other checks read is never transformed.
     */
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1];
    if (!csp) bad.push(`${p.file}: no CSP meta tag`);
    else if (/unsafe-inline|unsafe-eval/.test(csp))
      bad.push(`${p.file}: the dev CSP relaxation has leaked into the build`);
    if (/style="/.test(html)) bad.push(`${p.file}: inline style attribute, which the CSP blocks`);
    if (!html.includes('class="skip"')) bad.push(`${p.file}: no skip link`);
  }
  bad.forEach(block);

  const sitemap = readFileSync(resolve(dist, "sitemap.xml"), "utf8");
  for (const p of INDEXED) {
    if (!sitemap.includes(`<loc>${ORIGIN}${p.path}</loc>`))
      block(`sitemap.xml is missing ${p.path}`);
  }
  if (sitemap.includes("404")) block("sitemap.xml lists the 404 page.");

  const security = readFileSync(resolve(dist, ".well-known/security.txt"), "utf8");
  const expires = security.match(/Expires: (\S+)/)?.[1];
  if (!expires || new Date(expires) < new Date())
    block("security.txt has expired. Re-run `npm run seo`.");
}

// ---------------------------------------------------------------- report

const line = "─".repeat(64);
console.log(`\n${line}\nPre-flight — ${ORIGIN}\n${line}`);

if (warnings.length) {
  console.log(`\n${warnings.length} thing(s) to be aware of:\n`);
  warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}\n`));
}

if (blockers.length) {
  console.log(`\n${blockers.length} blocker(s):\n`);
  blockers.forEach((b, i) => console.log(`  ${i + 1}. ${b}\n`));
  console.log(`${line}\nNOT READY TO DEPLOY\n${line}\n`);
  process.exit(1);
}

console.log(`${line}\nReady to deploy.\n${line}\n`);
