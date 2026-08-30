/**
 * Guards the claims. Most of what this site sells is a promise about where data
 * goes, so the assertions below are less about rendering than about keeping the
 * copy and the code from drifting apart. If a check here fails, either the code
 * regressed or a sentence on the site has become untrue — both are bugs.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

import {
  BRIEFING_EMAIL,
  ORIGIN,
  PRIVACY_EMAIL,
  SECURITY_EMAIL,
  analyticsConfigured,
} from "../src/config.js";
import { INDEXED, PAGES } from "../scripts/pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(root, f), "utf8");

const headlines = [
  ["index.html", "Own your intelligence."],
  ["two-weeks/index.html", "We come in. You leave with a brief"],
  ["kit/index.html", "It stays."],
  ["law/index.html", "They draft. You keep the judgment"],
  ["institutions/index.html", "A ministry is a data problem"],
  ["how-we-work/index.html", "When someone entitled to ask, asks"],
  ["about/index.html", "Sovereignty is an engineering problem"],
  ["contact/index.html", "Tell us what the next painful week looks like"],
  ["privacy/index.html", "We collect almost nothing"],
  ["legal/index.html", "Who publishes this."],
  ["accessibility/index.html", "Built to be read by anything"],
  ["404.html", "That page is not here"],
];

const banned = [/chatgpt/i, /\bgpt\b/i, /claude/i, /gemini/i, /copilot/i];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", "check.mjs", ".git", "public"].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

// ---------------------------------------------------------------- headlines

for (const [file, needle] of headlines) {
  assert.match(
    read(file),
    new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `${file} has lost its headline`,
  );
}
assert.equal(headlines.length, PAGES.length, "headlines and the page manifest disagree");

// ---------------------------------------------------------------- named competitors

/*
 * The ban is on naming somebody else's chat product in copy a reader sees. It is
 * not on robots.txt, which is addressed to crawlers and where naming the agents
 * by their user-agent string is the whole point — so those lines are stripped
 * before the file is scanned.
 */
const crawlerDirective = /^(?:User-agent|Allow|Disallow):.*$/gim;

for (const file of walk(root)) {
  if (!/\.(html|js|css|mjs|md|yml)$/.test(file)) continue;
  const text = readFileSync(file, "utf8").replace(crawlerDirective, "");
  for (const re of banned) {
    assert.equal(re.test(text), false, `banned string ${re} in ${relative(root, file)}`);
  }
}
assert.match(read("public/robots.txt"), /User-agent: GPTBot/, "the crawler allow-list has gone");

// ---------------------------------------------------------------- home page copy

const home = read("index.html");
for (const mission of ["The Close", "The Mandate", "The Matter", "The Institution"]) {
  assert.match(home, new RegExp(mission), `home page has lost ${mission}`);
}

// ---------------------------------------------------------------- the field

for (const p of PAGES) {
  const html = read(p.file);
  assert.match(html, /<canvas id="field">/, `${p.file} is missing the field canvas`);
  assert.match(html, /<body data-page="[a-z-]+">/, `${p.file} is missing data-page`);
  assert.match(html, /class="masthead"/, `${p.file} is missing the masthead`);
}

const field = read("src/field.js");
for (const p of PAGES) {
  assert.match(
    field,
    new RegExp(`(^|[\\s{,])"?${p.page}"?:`, "m"),
    `field.js has no state for data-page="${p.page}", so it would fall back to home`,
  );
}

// ---------------------------------------------------------------- nothing leaves this origin

/*
 * The single most important check in this file. A page that quietly fetches a
 * font, a script or an image from somebody else's server discloses the reader's
 * IP address to them, which is the exact transfer this company argues against —
 * and, for Google Fonts specifically, the transfer a German court held unlawful
 * (LG München I, 3 O 17493/20).
 */
for (const p of PAGES) {
  const html = read(p.file);
  const external = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith(ORIGIN));
  assert.deepEqual(external, [], `${p.file} requests ${external.join(", ")} off-origin`);
}

const css = read("src/styles.css");
assert.doesNotMatch(css, /@import\s+url\(["']?https?:/, "styles.css imports a remote stylesheet");
/* A request, not a mention — the comment above the @font-face rules names Google
   Fonts in order to explain why the site does not use it. */
assert.doesNotMatch(
  css,
  /(?:https?:)?\/\/(?:fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.bunny)/,
  "remote font host requested in styles.css",
);
assert.match(css, /url\("\/fonts\/geist-variable\.woff2"\)/, "the self-hosted sans face is not referenced");
for (const f of ["public/fonts/geist-variable.woff2", "public/fonts/geist-mono-variable.woff2", "public/fonts/LICENSE.txt"]) {
  assert.ok(existsSync(join(root, f)), `${f} is missing — run \`npm run fonts\``);
}

// ---------------------------------------------------------------- no form vendor

for (const p of PAGES) {
  assert.doesNotMatch(
    read(p.file),
    /formspree|typeform|hubspot|google forms|netlify\/functions|getform|tally\.so/i,
    `${p.file} references a form vendor`,
  );
}
const contact = read("contact/index.html");
assert.match(contact, /action="mailto:/, "the briefing form must post to a mailto");
assert.match(contact, /enctype="text\/plain"/, "the no-JS fallback needs enctype=text/plain");

/*
 * Every address on the site has to be one of the three in config.js. The chrome
 * generator keeps the footer, the JSON-LD and the /legal/ contact row in step by
 * itself, but the briefing address is also hand-written into the body of
 * /contact/ — the form action, the no-JS fallback and the "prefer plain email"
 * aside — and those are exactly the copies that were left behind pointing at a
 * dead mailbox when the address changed.
 */
const known = new Set([BRIEFING_EMAIL, SECURITY_EMAIL, PRIVACY_EMAIL]);
for (const p of PAGES) {
  /* href= and action= only: the CSP itself contains a bare `mailto:` in form-action. */
  const addresses = [...read(p.file).matchAll(/(?:href|action)="mailto:([^"?&]+)/g)].map(
    (m) => m[1],
  );
  for (const a of addresses) {
    assert.ok(known.has(a), `${p.file} links to ${a}, which is not an address in config.js`);
  }
}

/*
 * main.js rewrites the href of every [data-briefing] link to the briefing
 * address at runtime. Put that attribute on a link that means something else and
 * the visible text keeps saying one address while the click goes to another — it
 * was on the Art. 15 data-request link on /privacy/, so a reader asking for
 * their own data would have sent a "Briefing request" to the wrong mailbox.
 */
for (const p of PAGES) {
  const wrong = [...read(p.file).matchAll(/<a data-briefing href="mailto:([^"?&]+)/g)]
    .map((m) => m[1])
    .filter((a) => a !== BRIEFING_EMAIL);
  assert.deepEqual(
    wrong,
    [],
    `${p.file} marks a link to ${wrong.join(", ")} as data-briefing, so JS will silently repoint it`,
  );
}

// ---------------------------------------------------------------- head furniture

for (const p of INDEXED) {
  const html = read(p.file);
  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${ORIGIN}${p.path}"`),
    `${p.file} has a missing or wrong canonical`,
  );
  assert.match(html, /Content-Security-Policy/, `${p.file} has no CSP`);
  assert.doesNotMatch(html, /style="/, `${p.file} has an inline style, which the CSP blocks`);
  assert.match(html, /class="skip"/, `${p.file} has no skip link`);
  assert.match(html, /<main id="main"/, `${p.file} has no main landmark for the skip link`);
  assert.match(html, /property="og:image"/, `${p.file} has no social card`);
  assert.match(html, /<html lang="en-GB">/, `${p.file} is not marked as British English`);
}
assert.match(read("404.html"), /content="noindex/, "the 404 page must not be indexable");

const csp = read("index.html").match(/Content-Security-Policy" content="([^"]+)"/)?.[1];
assert.ok(csp, "no CSP found on the home page");
assert.doesNotMatch(csp, /unsafe-inline/, "the CSP has fallen back to unsafe-inline");
assert.doesNotMatch(csp, /unsafe-eval/, "the CSP allows eval");
assert.match(csp, /form-action 'self' mailto:/, "the CSP would block the briefing form");

const headerCsp = read("nginx-security.conf").match(
  /add_header Content-Security-Policy "([^"]+)"/,
)?.[1];
assert.ok(headerCsp, "no CSP header found in nginx-security.conf");

/*
 * upgrade-insecure-requests achieves nothing here — every URL is relative and
 * same-origin, so on an https origin they are already https — and it makes the
 * site unreviewable over http://localhost in Safari, which upgrades each asset
 * to https and gets a TLS handshake refused by the plain HTTP port. The result
 * is a page with no CSS, no JS and no fonts. See the note in scripts/chrome.mjs.
 *
 * Both policies are read as the delivered directive string, not as whole files,
 * so the comments that warn against the directive do not trip this themselves.
 */
for (const [where, policy] of [
  ["the meta policy", csp],
  ["the nginx header", headerCsp],
]) {
  assert.doesNotMatch(
    policy,
    /upgrade-insecure-requests/,
    `${where} carries upgrade-insecure-requests, which breaks http://localhost in Safari`,
  );
}

/*
 * The policy exists twice because GitHub Pages cannot set headers and a real host
 * should not rely on a meta tag. Two copies drift, so compare them directive by
 * directive. frame-ancestors is the one legitimate difference: a meta tag cannot
 * express it, so the header carries it alone.
 */
const directives = (policy) =>
  policy
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith("frame-ancestors"))
    .sort();
assert.deepEqual(
  directives(headerCsp),
  directives(csp),
  "the nginx CSP header and the meta CSP have drifted apart",
);

// ---------------------------------------------------------------- consent

/*
 * The banner must not exist as decoration, and the script must not load before a
 * choice. Both are properties of consent.js rather than of the markup.
 */
const consent = read("src/consent.js");
assert.match(consent, /localStorage/, "the consent choice should be stored without a cookie");
assert.doesNotMatch(consent, /document\.cookie/, "consent must not set a cookie");
assert.match(consent, /if \(!analyticsConfigured\(\)\)/, "the banner must hide itself when nothing measures");
assert.match(
  consent,
  /loadAnalytics[\s\S]{0,400}?grantConsent|grantConsent\(\);\s*\n\s*loadAnalytics\(\)/,
  "analytics must only load after consent is granted",
);
for (const p of PAGES) {
  assert.match(read(p.file), /class="consent"/, `${p.file} is missing the consent banner`);
}
if (!analyticsConfigured()) {
  const privacy = read("privacy/index.html");
  assert.match(
    privacy,
    /Until that is running, the site asks you nothing and measures nothing/,
    "the privacy notice must say that nothing is measured while analytics is unconfigured",
  );
}

// ---------------------------------------------------------------- the US hosting admission

/*
 * We are on a US host while selling data sovereignty, so the admission has to
 * exist — but where it sits is a separate decision from whether it exists.
 *
 * It belongs on the two pages a reader reaches by asking: the privacy notice,
 * where Art. 13(1)(f) requires the third-country transfer to be named, and the
 * trust page, whose "every request is listed below" section would be a lie
 * without it. It does not belong in the furniture under all twelve pages, where
 * it argued against the pitch to readers who had not asked. These assertions
 * keep that split: the disclosure cannot be quietly dropped in a copy pass, and
 * it cannot creep back into the chrome either.
 */
assert.match(read("how-we-work/index.html"), /Served from the United States/, "how-we-work no longer admits where it is hosted");
assert.match(read("privacy/index.html"), /GitHub Pages, operated by GitHub, Inc\./, "the privacy notice no longer names the host");
assert.match(read("privacy/index.html"), /Standard Contractual Clauses/, "the privacy notice must name the transfer mechanism");

for (const p of PAGES.filter((p) => !/how-we-work|privacy/.test(p.file))) {
  assert.doesNotMatch(
    read(p.file),
    /served by GitHub Pages|served by \$\{/,
    `${p.file} advertises the US host outside the two pages that should carry it`,
  );
}

// ---------------------------------------------------------------- legal pages

const legal = read("legal/index.html");
assert.match(legal, /chrome:entity/, "the legal notice must carry the generated provider block");
assert.match(legal, /Governing law/, "the legal notice has lost its terms of use");

const access = read("accessibility/index.html");
assert.match(access, /It has not been independently audited/, "the accessibility statement must keep its honest caveat");
assert.match(access, /Known shortfalls/, "the accessibility statement has lost its shortfalls");

const privacy = read("privacy/index.html");
for (const section of ["collects", "hosting", "cookies", "email", "rights", "choice"]) {
  assert.match(privacy, new RegExp(`id="${section}"`), `the privacy notice has lost #${section}`);
}

// ---------------------------------------------------------------- internal links

/*
 * The nav and footer imply a site with some depth to it, which is only honest
 * while every link lands somewhere. Resolve all of them: a path must be a page we
 * ship, and a fragment must be an id that page actually carries.
 */
const pages = new Map(PAGES.map((p) => [p.path.replace(/404\.html$/, "404.html"), read(p.file)]));

let checked = 0;
for (const [from, html] of pages) {
  for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
    const [path, hash] = href.split("#");
    /* Files under public/ are shipped verbatim and are not pages. */
    if (/\.(png|svg|ico|xml|txt|webmanifest|woff2)$/.test(path) || path.startsWith("/.well-known/")) {
      assert.ok(
        existsSync(join(root, "public", path.slice(1))),
        `${from} links to ${path}, which is not in public/`,
      );
      checked += 1;
      continue;
    }
    const target = pages.get(path || "/");
    assert.ok(target, `${from} links to ${href}, which is not a page`);
    if (hash) {
      assert.match(
        target,
        new RegExp(`id="${hash}"`),
        `${from} links to ${href}, but #${hash} does not exist there`,
      );
    }
    checked += 1;
  }
}
assert.ok(checked > 200, `only ${checked} internal links found — is the chrome generated?`);

// ---------------------------------------------------------------- generated chrome

for (const p of PAGES) {
  const html = read(p.file);
  for (const marker of [
    "chrome:meta",
    "/chrome:meta",
    "chrome:head",
    "/chrome:head",
    "chrome:foot",
    "/chrome:foot",
    "chrome:consent",
    "/chrome:consent",
  ]) {
    assert.match(html, new RegExp(marker), `${p.file} is missing the ${marker} marker`);
  }
  assert.equal(
    (html.match(/class="mega"/g) || []).length,
    4,
    `${p.file} should carry four nav panels`,
  );
}

// ---------------------------------------------------------------- crawler files

const sitemap = read("public/sitemap.xml");
for (const p of INDEXED) {
  assert.match(sitemap, new RegExp(`<loc>${ORIGIN}${p.path}</loc>`), `sitemap is missing ${p.path}`);
}
assert.equal((sitemap.match(/<loc>/g) || []).length, INDEXED.length, "sitemap and manifest disagree");
assert.doesNotMatch(sitemap, /404/, "the sitemap lists the 404 page");
assert.match(read("public/robots.txt"), new RegExp(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt has no sitemap");

const security = read("public/.well-known/security.txt");
const expires = security.match(/Expires: (\S+)/)?.[1];
assert.ok(expires && new Date(expires) > new Date(), "security.txt has expired — run `npm run seo`");

console.log(
  `check.mjs: ok — ${PAGES.length} pages, ${checked} internal links resolve, nothing off-origin`,
);
