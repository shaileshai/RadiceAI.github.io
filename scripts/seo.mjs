/**
 * Writes the files crawlers and platforms look for, all from the same page
 * manifest the site is built from, so a sitemap can never quietly disagree with
 * what actually ships. Run `npm run seo` after adding a page.
 *
 * Everything here lands in `public/`, which Vite copies to the root of `dist/`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ORIGIN, SECURITY_EMAIL } from "../src/config.js";
import { INDEXED } from "./pages.mjs";

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public");
const today = new Date().toISOString().slice(0, 10);

const write = (file, body) => {
  const abs = resolve(out, file);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
  console.log(`seo: ${file}`);
};

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${INDEXED.map(
  (p) => `  <url>
    <loc>${ORIGIN}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.weight.toFixed(1)}</priority>
  </url>`,
).join("\n")}
</urlset>
`,
);

/*
 * The AI crawlers are listed explicitly rather than left to a wildcard. We are
 * not blocking them — an argument nobody can read is not much of an argument —
 * but a company selling data sovereignty should be able to say exactly which
 * agents it has considered.
 */
write(
  "robots.txt",
  `User-agent: *
Allow: /

# Marketing pages, meant to be read and quoted.
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

write(
  "site.webmanifest",
  `${JSON.stringify(
    {
      name: "Radice — Sovereign AI",
      short_name: "Radice",
      description:
        "Sovereign AI for professional firms and the state. Your files, your hardware, your model.",
      lang: "en-GB",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f4f4f2",
      theme_color: "#05070e",
      icons: [
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    null,
    2,
  )}\n`,
);

/* RFC 9116. Expires must be in the future or scanners treat the file as stale. */
const expires = new Date();
expires.setUTCFullYear(expires.getUTCFullYear() + 1);
write(
  ".well-known/security.txt",
  `Contact: mailto:${SECURITY_EMAIL}
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}
Preferred-Languages: en
Canonical: ${ORIGIN}/.well-known/security.txt
Policy: ${ORIGIN}/legal/#security
`,
);

/* Stops GitHub Pages running the output through Jekyll. */
write(".nojekyll", "");
