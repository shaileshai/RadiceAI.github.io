/**
 * The head, the masthead, the mobile menu, the consent banner and the footer are
 * identical across every page and far too big to keep in sync by hand, so this
 * file owns them. Edit the data below, run `npm run chrome`, and all eleven
 * pages are rewritten between their marker comments.
 *
 * Every href here must resolve to a page we ship or to a section id that page
 * actually carries — `npm test` fails otherwise. That is deliberate: a nav this
 * size on a site this small is only honest while nothing in it is invented.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ANALYTICS, BRIEFING_EMAIL, ENTITY, ORIGIN } from "../src/config.js";
import { PAGES } from "./pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const MAILTO = `mailto:${BRIEFING_EMAIL}?subject=Briefing%20request`;
const ARROW =
  '<svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true"><path d="M8 1l4 4-4 4M12 5H0" stroke="currentColor" stroke-width="1.3" /></svg>';

/** Top-level nav. Each item is a real destination *and* opens a panel. */
const NAV = [
  {
    label: "The offer",
    href: "/two-weeks/",
    groups: [
      {
        label: "Fourteen days",
        links: [
          ["/two-weeks/", "Two weeks", "A diagnosis inside the real workflow"],
          ["/two-weeks/#fortnight", "The fortnight", "Three moves, in the order that matters"],
          ["/two-weeks/#terms", "Terms", "Nothing is installed until you say so"],
        ],
      },
      {
        label: "What remains",
        links: [
          ["/kit/", "The kit", "What stays in the building afterwards"],
          ["/kit/#stack", "The stack", "What is actually installed"],
          ["/kit/#limits", "Limits", "What the kit is not"],
        ],
      },
    ],
    aside: {
      label: "Day 14",
      text: "A written map of where the files live, and a price to leave the kit running.",
      href: "/contact/",
      cta: "Request a briefing",
    },
  },
  {
    label: "Who it's for",
    href: "/law/",
    groups: [
      {
        label: "Professional firms",
        links: [
          ["/law/", "Law firms", "Privilege as a wall, not a setting"],
          ["/law/#shape", "The shape", "Matter files instead of client books"],
          ["/#missions", "Missions", "Four places the same stack earns its keep"],
        ],
      },
      {
        label: "The state",
        links: [
          ["/institutions/", "Institutions", "A ministry is a data problem too"],
          ["/institutions/#position", "Position", "A briefing, not a buy button"],
          ["/#doors", "Two doors", "Same engineering, different procurement"],
        ],
      },
    ],
    aside: {
      label: "Order",
      text: "Accountancy practices first, then law firms. Authorities on their own timetable.",
      href: "/#what-you-own",
      cta: "What you own",
    },
  },
  {
    label: "Trust",
    href: "/how-we-work/",
    groups: [
      {
        label: "What you can hold us to",
        links: [
          ["/how-we-work/", "How we work", "Where a file goes, and where it does not"],
          ["/how-we-work/#undertakings", "The undertakings", "Six lines, no asterisks"],
          ["/#premise", "The premise", "Why the boundary is drawn first"],
        ],
      },
      {
        label: "This site",
        links: [
          ["/how-we-work/#this-site", "How it is built", "Static pages, self-hosted fonts"],
          ["/privacy/", "Privacy and cookies", "What is collected, and where it is served"],
          ["/accessibility/", "Accessibility", "Keyboard, screen reader, reduced motion"],
        ],
      },
    ],
    aside: {
      label: "No form vendor",
      text: "A briefing travels through your own mail client to a published address. Nothing else is collected.",
      href: "/how-we-work/#this-site",
      cta: "Read the detail",
    },
  },
  {
    label: "Company",
    href: "/about/",
    groups: [
      {
        label: "The firm",
        links: [
          ["/about/", "About", "What we are, and the argument we are built on"],
          ["/about/#order", "The order", "Why accountancy comes before everything else"],
          ["/contact/", "Contact", "Tell us what the next painful week looks like"],
        ],
      },
      {
        label: "Legal",
        links: [
          ["/legal/", "Legal notice", "Who publishes this site, and the terms of use"],
          ["/privacy/", "Privacy and cookies", "GDPR notice, in plain sentences"],
          ["/accessibility/", "Accessibility", "Statement and known shortfalls"],
        ],
      },
    ],
    /*
     * Deliberately does not promise "a named operator": ENTITY is still
     * placeholder, so /legal/ answers "not yet registered" six times over. The
     * aside describes what that page covers, which is true before and after the
     * company is registered.
     */
    aside: {
      label: "Who publishes this",
      text: "The operator, the terms of use, and where to send a security report.",
      href: "/legal/",
      cta: "Legal notice",
    },
  },
];

/** Footer link columns, then a row of statements that are not links. */
const FOOT = [
  {
    label: "The offer",
    links: [
      ["/two-weeks/", "Two weeks"],
      ["/two-weeks/#fortnight", "The fortnight"],
      ["/two-weeks/#terms", "Terms"],
      ["/kit/", "The kit"],
      ["/kit/#stack", "The stack"],
      ["/kit/#limits", "Limits"],
    ],
  },
  {
    label: "Who it's for",
    links: [
      ["/law/", "Law firms"],
      ["/law/#shape", "The shape"],
      ["/institutions/", "Institutions"],
      ["/institutions/#position", "Position"],
      ["/#doors", "Two doors"],
      ["/#missions", "Missions"],
    ],
  },
  {
    label: "Trust",
    links: [
      ["/how-we-work/", "How we work"],
      ["/how-we-work/#undertakings", "The undertakings"],
      ["/how-we-work/#this-site", "This site"],
      ["/#what-you-own", "What you own"],
      ["/#premise", "The premise"],
    ],
  },
  {
    label: "Company",
    links: [
      ["/about/", "About"],
      ["/contact/", "Contact"],
      ["/legal/", "Legal notice"],
      ["/privacy/", "Privacy and cookies"],
      ["/accessibility/", "Accessibility"],
    ],
  },
];

/*
 * Statements rather than links. Padding a link grid with pages we have not
 * written is the exact habit the copy on this site argues against.
 */
const RUNS_ON = [
  "Hardware the firm already owns",
  "Or a European tenant in its name",
  "Never a shared cloud of many firms",
  "Their keys, their bill, their jurisdiction",
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const path = (href) => href.split("#")[0] || "/";

/** Only a link to the page itself is "current" — a link to one of its sections is not. */
const current = (href, here) =>
  !href.includes("#") && path(href) === here ? ' aria-current="page"' : "";

// ---------------------------------------------------------------- head

const jsonLd = (p) => {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radice",
    url: `${ORIGIN}/`,
    description:
      "Sovereign AI for professional firms and the state. Small language models deployed inside a boundary the client already controls.",
    email: BRIEFING_EMAIL,
    ...(ENTITY.legalName ? { legalName: ENTITY.legalName } : {}),
    ...(ENTITY.vat ? { vatID: ENTITY.vat } : {}),
    ...(ENTITY.street && ENTITY.city && ENTITY.country
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: ENTITY.street,
            addressLocality: ENTITY.city,
            addressCountry: ENTITY.country,
          },
        }
      : {}),
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Radice",
    url: `${ORIGIN}/`,
    inLanguage: "en-GB",
  };
  const data = p.path === "/" ? [org, site] : [org];
  return `    <script type="application/ld+json">
${JSON.stringify(data.length === 1 ? data[0] : data, null, 2)
  .split("\n")
  .map((l) => `      ${l}`)
  .join("\n")}
    </script>`;
};

/*
 * GitHub Pages cannot set response headers, so the policy has to travel in the
 * markup. `frame-ancestors` and HSTS are header-only and therefore absent here —
 * `nginx.conf` carries the full set for the day the site moves to its own host.
 *
 * No 'unsafe-inline' anywhere: there are no inline scripts, and the twelve
 * inline style attributes that used to exist are now a CSS rule. `mailto:` is in
 * form-action because the briefing form posts to the visitor's mail client.
 *
 * `upgrade-insecure-requests` is deliberately absent, and must stay absent. It
 * would do nothing in production — every URL on this site is relative and
 * same-origin, so on an https origin they are already https, and `default-src
 * 'self'` plus the off-origin test in check.mjs mean there is no http URL left
 * to upgrade. What it *did* do was break every review over http://localhost:
 * Chrome exempts localhost as a potentially-trustworthy origin, WebKit does not,
 * so Safari rewrote each asset to https, nginx answered the TLS handshake on its
 * plain HTTP port with a 400, and the site rendered as unstyled markup. A
 * directive with no production effect and that failure mode is not worth having.
 */
const csp = () =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self'" + (ANALYTICS.host ? ` ${ANALYTICS.host}` : ""),
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'" + (ANALYTICS.host ? ` ${ANALYTICS.host}` : ""),
    "form-action 'self' mailto:",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");

const head = (p) => `<!-- chrome:meta -->
    <meta http-equiv="Content-Security-Policy" content="${csp()}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.description)}" />
${
  p.noindex
    ? '    <meta name="robots" content="noindex, follow" />'
    : `    <link rel="canonical" href="${ORIGIN}${p.path}" />`
}
    <meta name="theme-color" content="#05070e" />
    <meta name="color-scheme" content="light dark" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Radice" />
    <meta property="og:locale" content="en_GB" />
    <meta property="og:title" content="${esc(p.title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta property="og:url" content="${ORIGIN}${p.path}" />
    <meta property="og:image" content="${ORIGIN}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Radice — own your intelligence" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(p.title)}" />
    <meta name="twitter:description" content="${esc(p.description)}" />
    <meta name="twitter:image" content="${ORIGIN}/og.png" />

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Self-hosted. Nothing here may point at a font CDN. -->
    <link rel="preload" href="/fonts/geist-variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/geist-mono-variable.woff2" as="font" type="font/woff2" crossorigin />

${jsonLd(p)}
    <!-- /chrome:meta -->`;

// ---------------------------------------------------------------- masthead

const megaLink = ([href, title, note], here) => `
                  <a href="${href}"${current(href, here)}>
                    <b>${title}</b>
                    <span>${note}</span>
                  </a>`;

/*
 * A nav item owns the page when it links to the page itself. Section links are
 * excluded, or every item would own the home page — each of them points at some
 * section of it. Only the first owner is marked: /privacy/ legitimately appears
 * under both Trust and Company, and lighting up two top-level items at once
 * reads as a bug rather than as thoroughness.
 */
const ownerOf = (here) =>
  NAV.findIndex((item) =>
    item.groups.some((g) =>
      g.links.some(([href]) => !href.includes("#") && path(href) === here),
    ),
  );

const navItem = (item, here, owns) => {
  const id = `mega-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return `
        <div class="nav-item"${owns ? " data-owns" : ""}>
          <a class="nav-top" href="${item.href}"${current(item.href, here)}>${item.label}</a>
          <div class="mega" id="${id}">
            <div class="mega-inner">
              <div class="mega-cols">${item.groups
                .map(
                  (g) => `
                <div class="mega-group">
                  <p class="mega-label">${g.label}</p>${g.links
                    .map((l) => megaLink(l, here))
                    .join("")}
                </div>`,
                )
                .join("")}
              </div>
              <aside class="mega-aside">
                <p class="mega-label">${item.aside.label}</p>
                <p>${item.aside.text}</p>
                <a class="link" href="${item.aside.href}">${item.aside.cta} ${ARROW}</a>
              </aside>
            </div>
          </div>
        </div>`;
};

const body = (here) => `<!-- chrome:head -->
    <a class="skip" href="#main">Skip to content</a>
    <header class="masthead">
      <a class="wordmark" href="/"><i></i>Radice</a>
      <nav class="nav" aria-label="Primary">${(() => {
        const owner = ownerOf(here);
        return NAV.map((i, n) => navItem(i, here, n === owner)).join("");
      })()}
      </nav>
      <a class="ask" href="/contact/"${current("/contact/", here)}>
        <span>Briefing</span>
        <i>${ARROW}</i>
      </a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">
        <span class="bars" aria-hidden="true"><i></i><i></i></span>
        <span class="menu-label">Menu</span>
      </button>
    </header>

    <div class="menu" id="menu">
      <nav class="menu-nav" aria-label="Menu">${NAV.map(
        (item) => `
        <section>
          <p class="mega-label">${item.label}</p>${item.groups
            .flatMap((g) => g.links)
            .map(
              ([href, title]) => `
          <a href="${href}"${current(href, here)}>${title}</a>`,
            )
            .join("")}
        </section>`,
      ).join("")}
      </nav>
      <a class="btn" href="/contact/">
        <span>Request a briefing</span>
        <i>${ARROW}</i>
      </a>
    </div>
    <!-- /chrome:head -->`;

// ---------------------------------------------------------------- footer

const footCol = (col, here) => `
          <div class="foot-col">
            <h4>${col.label}</h4>${col.links
              .map(
                ([href, title]) => `
            <a href="${href}"${current(href, here)}>${title}</a>`,
              )
              .join("")}
          </div>`;

const foot = (here) => `<!-- chrome:foot -->
    <footer class="foot band">
      <div class="wrap">
        <div class="foot-top">
          <div>
            <a class="wordmark" href="/"><i></i>Radice</a>
            <p class="foot-claim">Sovereign AI for professional firms and the state.<br />The file does not travel.</p>
          </div>
          <a class="btn btn--line" href="/contact/">
            <span>Request a briefing</span>
            <i>${ARROW}</i>
          </a>
        </div>
        <div class="foot-grid">${FOOT.map((c) => footCol(c, here)).join("")}
        </div>
        <div class="foot-runs">
          <h4>Where it runs</h4>
          <ul class="foot-facts">${RUNS_ON.map((f) => `
            <li>${f}</li>`).join("")}
          </ul>
        </div>
        <div class="foot-end">
          <span>© 2026 Radice${ENTITY.legalName ? ` · ${esc(ENTITY.legalName)}` : ""}</span>
          <a data-briefing href="${MAILTO}">${BRIEFING_EMAIL}</a>
        </div>
      </div>
    </footer>
    <!-- /chrome:foot -->`;

// ---------------------------------------------------------------- consent

const consent = () => `<!-- chrome:consent -->
    <!--
      Removed at runtime when config.js has no analytics host, because there is
      then nothing to consent to. Nothing loads before a choice is made, and
      Decline is a real button of equal weight.
    -->
    <aside class="consent" role="dialog" aria-modal="false" aria-label="Analytics consent">
      <div class="consent-inner">
        <div>
          <p class="mega-label">Measurement</p>
          <p>
            We would like to count page views on our own server, without cookies and
            without sending anything to a third party. Decline and nothing is
            recorded. <a href="/privacy/">What this means</a>
          </p>
        </div>
        <div class="consent-acts">
          <button class="btn btn--line" type="button" data-consent-decline>
            <span>Decline</span>
          </button>
          <button class="btn" type="button" data-consent-accept>
            <span>Accept</span>
            <i>${ARROW}</i>
          </button>
        </div>
      </div>
    </aside>
    <!-- /chrome:consent -->`;

// ---------------------------------------------------------------- entity block

const TBD = '<em class="tbd">not yet registered</em>';

const entity = () => `<!-- chrome:entity -->
        <div class="ledger">
          <div><b>Provider</b><p>${ENTITY.legalName ? esc(ENTITY.legalName) : TBD}</p></div>
          <div><b>Legal form</b><p>${ENTITY.form ? esc(ENTITY.form) : TBD}</p></div>
          <div><b>Address</b><p>${
            ENTITY.street && ENTITY.city && ENTITY.country
              ? `${esc(ENTITY.street)}, ${esc(ENTITY.city)}, ${esc(ENTITY.country)}`
              : TBD
          }</p></div>
          <div><b>Register</b><p>${ENTITY.register ? esc(ENTITY.register) : TBD}</p></div>
          <div><b>VAT</b><p>${ENTITY.vat ? esc(ENTITY.vat) : TBD}</p></div>
          <div><b>Responsible for content</b><p>${
            ENTITY.representative ? esc(ENTITY.representative) : TBD
          }</p></div>
          <div><b>Contact</b><p><a data-briefing href="${MAILTO}">${BRIEFING_EMAIL}</a></p></div>
        </div>
        <!-- /chrome:entity -->`;

// ---------------------------------------------------------------- write

const swap = (s, file, marked, legacy, next) => {
  if (marked.test(s)) return s.replace(marked, next);
  if (legacy && legacy.test(s)) return s.replace(legacy, next);
  throw new Error(`no region to replace in ${file} for ${marked}`);
};

let wrote = 0;
for (const p of PAGES) {
  const abs = resolve(root, p.file);
  let s = readFileSync(abs, "utf8");

  s = s.replace(/<html lang="[^"]*">/, '<html lang="en-GB">');
  s = s.replace(/<body data-page="[^"]*">/, `<body data-page="${p.page}">`);

  s = swap(
    s,
    p.file,
    /<!-- chrome:meta -->[\s\S]*?<!-- \/chrome:meta -->/,
    /<title>[\s\S]*?(?=\n\s*<\/head>)/,
    head(p),
  );
  s = swap(
    s,
    p.file,
    /<!-- chrome:head -->[\s\S]*?<!-- \/chrome:head -->/,
    /<header class="masthead"[\s\S]*?(?=\n\s*<main>)/,
    body(p.path),
  );
  s = swap(
    s,
    p.file,
    /<!-- chrome:foot -->[\s\S]*?<!-- \/chrome:foot -->/,
    /<footer class="foot band">[\s\S]*?<\/footer>/,
    foot(p.path),
  );
  s = swap(
    s,
    p.file,
    /<!-- chrome:consent -->[\s\S]*?<!-- \/chrome:consent -->\n?/,
    /(?=\n\s*<script type="module")/,
    `${consent()}\n`,
  );

  if (/<!-- chrome:entity -->/.test(s)) {
    s = s.replace(/<!-- chrome:entity -->[\s\S]*?<!-- \/chrome:entity -->/, entity());
  }

  writeFileSync(abs, s);
  wrote += 1;
}

console.log(`chrome written into ${wrote} pages`);

export { NAV, FOOT };
