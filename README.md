# Radice site

Source for `https://radiceai.github.io`.

```bash
npm install
npm test
npm run dev
```

Production:

```bash
npm run build      # -> dist/
npm run preflight  # the deploy gate; see below
```

Local production test — nginx, real security headers, real cache policy:

```bash
docker compose up --build
```

Open http://127.0.0.1:8080/

## Before it goes live

`npm run preflight` is the gate between "it builds" and "it is publishable". It
fails on one thing today, and that one thing is a genuine launch blocker:

**`ENTITY` in `src/config.js` is empty.** An EU commercial site must identify its
operator — legal name, form, address, register, VAT, and who is responsible for
the content (e-Commerce Directive Art. 5; in Germany §5 DDG). Until those are
filled in, `/legal/` shows each missing field in red as `NOT YET REGISTERED`
rather than inventing one, and the pre-flight refuses to pass. Fill them on the
day incorporation completes.

Two things pre-flight warns about rather than blocks:

- **Analytics is not configured**, so nothing is measured and no consent banner
  appears. `/privacy/` says exactly that, so the site is honest in this state.
- **The site is served from the United States.** See below.

Everything else — canonical URLs, the sitemap, the social card, `security.txt`,
the absence of any off-origin request — is asserted by `npm test` and
`npm run preflight` and currently passes.

## Deployment

**This directory is the repository root.** Not `Radice/`, not the project folder
above it. Everything outside it — the strategy notes in `../../Misc`, the design
specs in `../docs` — is deliberately not in the repository, because GitHub Pages
needs a *public* repository on a free plan, and a public repository is a bad
place for a market thesis and a competitor teardown. That boundary is the reason
the repo can be public at all; do not move the root up a level for convenience.

`.github/workflows/deploy.yml` builds and publishes on a push to `main`. It runs
`npm test` before the build, and fails if `npm run chrome` or `npm run seo` would
produce a diff — that is, if someone edited a generated header or the sitemap by
hand.

### First-time setup

1. Create the GitHub account or organisation named in `ORIGIN` — currently
   `radiceai`.
2. Create a repository named **exactly** `radiceai.github.io` under it, and push
   this directory to `main`.
3. In the repository, set **Settings → Pages → Source** to **GitHub Actions**.
   Without this the workflow runs and publishes nothing.

The repository name is not cosmetic. `<account>.github.io` is served at the root;
any other name is a *project* site served under `/repo-name/`, and since Vite
builds with `base: "/"` and every link, asset and font path on this site is
absolute from the root, all of them would 404 while the build reported success.
`npm run preflight` restates this whenever `ORIGIN` is a `github.io` address.

### The US hosting problem

GitHub Pages is operated by GitHub, Inc. in the United States, so every visitor's
IP address is processed there. For a firm whose entire argument is that files
should not cross borders, this is the first thing a sceptical buyer will check.

It is disclosed in two places on purpose — `/privacy/#hosting` and the
`Served from the United States` row on `/how-we-work/` — and `npm test` asserts
that both admissions are still present, so a later copy pass cannot quietly drop
them. No client file, document or model touches this host; the kit we install has
no connection to it.

When the site moves to a European host: set `HOSTING.inEurope` and rewrite those
two sections the same day. `nginx.conf` and `nginx-security.conf` are already
sized for it, and GitHub Pages is the only reason those headers are duplicated
into a `<meta>` tag — Pages cannot set response headers at all.

## Privacy, cookies and measurement

- **No cookies.** None, in any state. The consent choice is one localStorage
  entry, `radice.consent`, so declining leaves nothing behind.
- **Nothing loads before consent.** `src/consent.js` injects the analytics script
  only after Accept is clicked. A banner that blocks a tracker already sitting in
  `<head>` is theatre, and `npm test` asserts the ordering in that file.
- **The banner removes itself** when `ANALYTICS` in `src/config.js` has no host,
  because there is then nothing to consent to.
- **Decline is a real button** of equal size and weight. Do not make it a link.
- Point `ANALYTICS.host` at your own Umami instance on a European server. Anything
  resolving to a third-party domain contradicts `/privacy/`, and pre-flight warns
  about the ones we could think of.

### Fonts

`src/styles.css` serves Geist and Geist Mono from `public/fonts` as two variable
files. **Never reintroduce a font CDN.** A page that fetches
`fonts.googleapis.com` discloses the reader's IP to a US server before they have
agreed to anything, which is unlawful in the EU (LG München I, 3 O 17493/20) and
the exact opposite of what this site sells. `npm test` fails on any off-origin
`href` or `src` in any page, and on a remote font host in the CSS.

Refresh the files with `npm run fonts` after bumping the `geist` dependency.

## How it is built

Twelve static HTML pages — six on the offer, `about`, `contact`, three legal
documents, and a real designed `404`. The chrome — the whole `<head>`, masthead,
nav panels, mobile menu, consent banner, footer — is generated into all twelve by
`scripts/chrome.mjs`, so **edit that file and run `npm run chrome`, never the
`<head>`, `<header>` or `<footer>` in a page**. It rewrites everything between
the `chrome:meta`, `chrome:head`, `chrome:foot`, `chrome:consent` and
`chrome:entity` marker comments; `npm test` fails if a page is missing one.

### Generators

- `scripts/pages.mjs` — the page manifest. The one place that lists what exists.
  Adding a page means adding it here **and** to `vite.config.js` **and** creating
  the directory; the checks fail loudly if any of the three is missed.
- `scripts/chrome.mjs` — the nav and footer as data, plus the head and the CSP.
  Four top-level items, each a real link plus a panel of grouped links with a
  one-line descriptor; four footer columns, then a row of statements.

  Every href in here must resolve, and `npm test` proves it: a path has to be a
  page we ship, and a fragment has to be an id that page carries. That is what
  lets a small site carry a nav this size without implying pages it has not
  written. If you want a new entry, write the section first.
- `scripts/seo.mjs` — `sitemap.xml`, `robots.txt`, `site.webmanifest`,
  `.well-known/security.txt`, `.nojekyll`, all from the same manifest, so the
  sitemap cannot disagree with what ships. `security.txt` expires, so re-run it
  at least yearly; `npm test` fails once it has.
- `scripts/icons.mjs` — `favicon.ico`, `apple-touch-icon.png`, `icon-512.png` and
  the 1200×630 `og.png`, rendered through headless Chromium with the real fonts.
  Output is committed so a build never needs a browser.
- `scripts/fonts.mjs` — copies the two variable faces out of `node_modules`.

### Runtime

- `src/config.js` — every fact about the deployment. Origin, addresses, hosting,
  analytics, provider identification. Pre-flight reads the same file.
- `src/consent.js` — the consent gate. See above.
- `src/field.js` — the object: in-house AI as a small scene. A glass room with
  chrome beading on its arrises, a chrome machine on the room's dark floor, and
  a model above it — four rings of nodes wired ring to ring, fed from the
  machine — with a signal that climbs the stack and brightens each layer as it
  arrives. Around it, a dashed measurement cage. Reflections come from
  `studio()`, a procedural environment (graded surround plus softbox planes)
  prefiltered through `PMREMGenerator`, so there are no HDRI or texture assets
  to ship. `STATES` holds one entry per page; `setPage()` tweens between them,
  and `npm test` fails if a page has no state.

  Three things to know before changing it. Abstract solids were tried at length
  — box, cylinder, icosahedron — and every one of them read as an object from
  the world (appliance, battery, bottle) rather than as an idea; the meaning came
  from making it a scene, not from a better shape. The glass panes are kept at
  `envMapIntensity: 0.2` because at full strength they go milky and hide the
  network. And the wires are opaque on purpose: as transparent lines they sorted
  behind the glass shell and vanished, so their brightness is animated through
  the colour instead.
- `src/router.js` — soft navigation. Intercepts same-origin links, fetches and
  swaps `<main>`, and leaves the canvas mounted so the object morphs instead of
  restarting. Prefetches on hover. A link with a fragment scrolls to that
  section after the swap rather than to the top. The chrome lives outside
  `<main>` and survives the swap, so `markCurrent()` re-marks it by hand: a link
  to the page itself becomes `aria-current`, a link to one of its sections never
  does, and the **first** group holding the page gets `data-owns` — `/privacy/`
  sits under both Trust and Company, and two lit items reads as a bug. Keep that
  rule in step with `ownerOf()` in `scripts/chrome.mjs`.
- `src/reveal.js` — scroll reveals, staggered by position within their parent.
- `src/main.js` — wires the briefing `mailto:` links, the briefing form, the
  mobile menu, the scroll-driven masthead and object fade, and re-hydrates
  everything after a route swap. `wireNav()` does one job: closing a panel after
  a click inside it. Opening is pure CSS (`:hover` and `:focus-within`) so the
  panels work with JS off and from the keyboard — do not reimplement that in JS.

Anything that runs on route swap must be idempotent — `hydrate()` is called again
for every navigation.

The object is scenery for the opening section only. `onScroll` writes
`--field-fade` (1 → 0 over the first 40% of the hero or page head, eased) and the
canvas reads it for opacity and a small scale-down, so it dissolves under the
reader's hand instead of switching off at a threshold. It peaks at 0.7 rather
than 1 — it should sit behind the page, not on it.

## The briefing form

`/contact/` has no backend. With JS it composes a labelled message and hands it to
the visitor's own mail client; without JS the form's own
`action="mailto:" enctype="text/plain"` does a cruder version of the same thing.
Nothing typed into it reaches us, or anyone else, until the visitor sends it.

**Do not replace this with a form service without rewriting `/how-we-work/`,
`/privacy/` and `/contact/` the same day.** `npm test` fails on a list of the
usual vendors, which is the cheap version of that reminder.

## Accessibility

`/accessibility/` makes specific claims, so they are checked:

```bash
docker compose up --build -d
npm run contrast
```

`tests/contrast.mjs` measures every text element on every page against its
computed background and fails on anything under WCAG AA. It found eleven real
shortfalls when it was written, including the brand accent — white on `#2f6bff`
is 4.497:1, a hair under the 4.5:1 threshold — which is why `--accent` is now
`#2860e6` and `--accent-lift` exists for accent text on the dark bands. Those two
comments in `styles.css` carry the measurements; do not "restore" the old blue.

Text over the navy gradient bands is reported separately and not failed, because
there is no single background colour to measure against. The masthead, mobile
menu and consent banner are skipped for the same reason and checked by eye.

## Rules that are easy to break

- **Do not add a `style` attribute to any page.** The CSP has no
  `unsafe-inline`, so it will not apply. `npm test` fails on one.
- Panel and bar must be the same paper. The masthead flips `--chrome-ink` and
  goes opaque while a panel is open; leave it translucent and the scrolled
  background shows as a seam across the top of the panel. Its height reacts to
  scroll only, never to a panel opening.
- The current-page nav marker is white on the dark chrome and blue only once the
  bar has gone to paper. Accent blue on the hero gradient is close to invisible.
- Anchored sections keep `scroll-margin-top`, or the fixed masthead covers the
  heading you just linked to.
- Copy goes inside `.col`, which is the full container except inside `.hero` and
  `.page-head`, where it narrows to 56% because the right-hand column belongs to
  the object.
- Sections fill the width by having a shape, not by widening one column of
  prose. `.spread` sets a section head beside its own prose; `.pillars`,
  `.points` and `.days` are three-across; `.prop` and `.ledger` are multi-column
  rows. A new section that is only a heading plus one paragraph needs a sentence
  in the right-hand column, or it will look squeezed against the left edge.
- `.notice` is the dark card that floats over the hero; `.aside-note` is its
  paper-band cousin for document pages. They are not interchangeable.
- Grid dividers are borders on the cells. Do not switch them back to `gap: 1px`
  over a container background: cells carry `data-reveal`, so an unrevealed cell
  would show the container colour as a grey block.
- Inner page heads need their `min-height` — the object is centred on the
  viewport, so a short head leaves it hanging over the paper section below.
- Nothing between `<body>` and a section's `.wrap` may create a stacking context
  (no `isolation`, no `z-index` on `.band`), or the object paints on the wrong
  side of the text.
- `.btn` styles the inner `span`, not the element. A `<button class="btn">` needs
  the `button.btn` reset or the UA's grey button face shows behind it.

`prefers-reduced-motion` removes the object, the reveals, and the router, leaving
plain documents.
