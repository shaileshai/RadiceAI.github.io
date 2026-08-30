import { ANALYTICS, analyticsConfigured } from "./config.js";

/**
 * Consent, then measurement — in that order, with nothing loaded before the
 * visitor has said yes.
 *
 * Under the ePrivacy Directive as implemented across the EU, consent must be
 * freely given, specific, informed and unambiguous, and withdrawing it must be
 * as easy as giving it. Three things follow, and all three are load-bearing:
 *
 * - Nothing is requested before a choice is made. Not a script, not a pixel.
 *   A banner that "blocks" a tracker already loaded in <head> is theatre.
 * - Decline is a real button of equal weight, not a greyed link. No dark
 *   patterns, no "legitimate interest" tab, no pre-ticked boxes.
 * - The choice itself is kept in localStorage rather than a cookie, so
 *   declining leaves no cookie at all. Storing it is strictly necessary in the
 *   sense of Art. 5(3) — it exists only to honour the refusal.
 *
 * The banner is not shown while `config.js` has no analytics host, because
 * there is then genuinely nothing to consent to and asking anyway would be
 * dishonest furniture.
 */

const KEY = "radice.consent";
const listeners = new Set();

export const readConsent = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    /* Private mode with storage blocked: treat as undecided, ask again. */
    return null;
  }
};

const writeConsent = (value) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* Nothing to do — the visit stays unmeasured, which is the safe failure. */
  }
  listeners.forEach((fn) => fn(value));
};

export const onConsent = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const grantConsent = () => writeConsent("granted");
export const revokeConsent = () => writeConsent("denied");

let loaded = false;

/** Injects the analytics script. Only ever called after consent is granted. */
const loadAnalytics = () => {
  if (loaded || !analyticsConfigured()) return;
  loaded = true;
  const s = document.createElement("script");
  s.defer = true;
  s.src = new URL("/script.js", ANALYTICS.host).href;
  s.dataset.websiteId = ANALYTICS.website;
  /* Umami: no cookies, no cross-site identifiers, respect Do Not Track. */
  s.dataset.doNotTrack = "true";
  s.dataset.autoTrack = "true";
  document.head.append(s);
};

/** A soft navigation is not a page load, so the view has to be sent by hand. */
export const trackView = (path) => {
  if (!loaded) return;
  window.umami?.track?.((props) => ({ ...props, url: path }));
};

export function mountConsent() {
  const banner = document.querySelector(".consent");
  if (!banner) return;

  const decided = readConsent();

  if (!analyticsConfigured()) {
    /* Nothing measures anything yet; do not ask a question with no subject. */
    banner.remove();
    return;
  }

  if (decided === "granted") loadAnalytics();
  if (!decided) requestAnimationFrame(() => banner.classList.add("consent--on"));

  banner.querySelector("[data-consent-accept]")?.addEventListener("click", () => {
    grantConsent();
    loadAnalytics();
    banner.classList.remove("consent--on");
  });

  banner.querySelector("[data-consent-decline]")?.addEventListener("click", () => {
    revokeConsent();
    banner.classList.remove("consent--on");
  });

  /*
   * Withdrawal has to be as easy as consent, so any link to the privacy page
   * carrying #choice re-opens the banner instead of leaving the reader to
   * hunt through browser settings.
   */
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href$="#choice"]');
    if (!a) return;
    banner.classList.add("consent--on");
  });
}
