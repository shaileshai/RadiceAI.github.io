/**
 * Every fact about the deployment lives here, so that the site, the generated
 * chrome and the pre-flight check all read the same numbers. `npm run preflight`
 * refuses to pass while anything below is still a placeholder.
 */

/** Canonical origin. Must match where the site is actually served. */
export const ORIGIN = "https://radiceai.github.io";

/*
 * Deliverable-while-testing address. This one is rendered publicly — the footer
 * of every page, the Organization JSON-LD, the contact row on /legal/ and the
 * fallback the briefing form posts to — so it is not only a test target. Point it
 * back at a radice.ai address before the site is shown to anyone: Namecheap
 * forwarding is already live on the domain (the MX records resolve), so
 * briefing@radice.ai can land in the same inbox without a personal address on
 * twelve pages.
 */
export const BRIEFING_EMAIL = "shailesh.tripathi003@gmail.com";

/*
 * Still on the domain, and still undeliverable until forwarding rules exist for
 * them. SECURITY_EMAIL is published in /.well-known/security.txt and
 * PRIVACY_EMAIL is the Art. 13 contact for data-subject requests, so a request
 * sent to either currently goes nowhere.
 */
export const SECURITY_EMAIL = "security@radice.ai";
export const PRIVACY_EMAIL = "privacy@radice.ai";

/**
 * Where the site is served from, in plain words, for `how-we-work` and the
 * privacy notice. This is a US host today. Say so — a sovereignty pitch that
 * quietly hosts its own marketing in Virginia is the one thing a sceptical
 * buyer will actually check.
 */
export const HOSTING = {
  provider: "GitHub Pages",
  country: "United States",
  operator: "GitHub, Inc.",
  /* Set true only once the site itself is served from the EU. */
  inEurope: false,
};

/**
 * Analytics is off until both fields are set, and even then it does not load
 * until the visitor accepts. Point `host` at your own Umami instance on an EU
 * server; anything that resolves to a third-party domain defeats the purpose.
 *
 *   host:    "https://stats.example.eu"
 *   website: the Umami website id (a UUID)
 */
export const ANALYTICS = {
  host: "",
  website: "",
};

export const analyticsConfigured = () =>
  Boolean(ANALYTICS.host && ANALYTICS.website);

/**
 * Provider identification, required of any commercial site in the EU by the
 * e-Commerce Directive (Art. 5) and, in Germany, by §5 DDG. A null here is a
 * launch blocker, not a nice-to-have: without it the site is not lawfully
 * publishable and the Impressum link in the footer goes to a stub.
 */
export const ENTITY = {
  legalName: null, // e.g. "Radice B.V."
  form: null, // e.g. "Besloten vennootschap"
  street: null,
  city: null,
  country: null,
  register: null, // e.g. "KvK 12345678, Amsterdam"
  vat: null, // e.g. "NL123456789B01"
  representative: null, // person responsible for content
};

export const entityComplete = () => Object.values(ENTITY).every(Boolean);

export function briefingHref() {
  const body = [
    "Name:",
    "Firm:",
    "Country:",
    "Role:",
    "",
    "What the next painful week looks like:",
    "",
  ].join("\n");
  return `mailto:${BRIEFING_EMAIL}?subject=${encodeURIComponent("Briefing request")}&body=${encodeURIComponent(body)}`;
}
