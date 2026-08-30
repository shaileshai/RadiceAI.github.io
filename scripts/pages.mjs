/**
 * The page manifest. Everything that has to agree about which pages exist reads
 * this: the chrome generator, the sitemap, and the link check in `npm test`.
 * Adding a page means adding it here and to `vite.config.js` — nowhere else.
 *
 * `weight` is only a sitemap priority hint.
 */
export const PAGES = [
  {
    file: "index.html",
    path: "/",
    page: "home",
    weight: 1.0,
    title: "Radice — Sovereign AI for professional firms and the state",
    description:
      "Own your intelligence. Your files, your hardware, your model — sovereign AI for professional firms and the state.",
  },
  {
    file: "two-weeks/index.html",
    path: "/two-weeks/",
    page: "two-weeks",
    weight: 0.9,
    title: "Two weeks — Radice",
    description:
      "Fourteen days inside the real workflow. You leave with a written brief and a price, and nothing is installed until you say so.",
  },
  {
    file: "kit/index.html",
    path: "/kit/",
    page: "kit",
    weight: 0.9,
    title: "The kit — Radice",
    description:
      "It stays. The stack that remains after the two weeks, on your hardware or a European tenant in your own name.",
  },
  {
    file: "law/index.html",
    path: "/law/",
    page: "law",
    weight: 0.8,
    title: "Law firms — Radice",
    description:
      "They draft. You keep the judgment. Matter files stay inside the boundary, and privilege is a wall rather than a setting.",
  },
  {
    file: "institutions/index.html",
    path: "/institutions/",
    page: "institutions",
    weight: 0.8,
    title: "Institutions — Radice",
    description:
      "A ministry is a data problem too. The same engineering, on infrastructure the authority controls rather than rents.",
  },
  {
    file: "how-we-work/index.html",
    path: "/how-we-work/",
    page: "how-we-work",
    weight: 0.8,
    title: "How we work — Radice",
    description:
      "What you can hold us to: where a file goes and does not, who can see a prompt, and what is destroyed after two weeks.",
  },
  {
    file: "about/index.html",
    path: "/about/",
    page: "about",
    weight: 0.7,
    title: "About — Radice",
    description:
      "A small engineering firm that builds intelligence inside other people's boundaries, and the argument it is built on.",
  },
  {
    file: "contact/index.html",
    path: "/contact/",
    page: "contact",
    weight: 0.9,
    title: "Request a briefing — Radice",
    description:
      "Tell us what the next painful week looks like. The message goes through your own mail client — there is no form vendor in the middle.",
  },
  {
    file: "privacy/index.html",
    path: "/privacy/",
    page: "privacy",
    weight: 0.4,
    title: "Privacy and cookies — Radice",
    description:
      "What this site collects, what it sets, where it is served from, and how to withdraw consent. Short, because there is little to say.",
  },
  {
    file: "legal/index.html",
    path: "/legal/",
    page: "legal",
    weight: 0.4,
    title: "Legal notice — Radice",
    description:
      "Provider identification and terms of use for this website, as required of a commercial site in the European Union.",
  },
  {
    file: "accessibility/index.html",
    path: "/accessibility/",
    page: "accessibility",
    weight: 0.4,
    title: "Accessibility — Radice",
    description:
      "How this site is built for keyboard, screen reader and reduced motion, what is known to fall short, and how to report a barrier.",
  },
  /*
   * Served by GitHub Pages for any unmatched path. It carries the full chrome so
   * a wrong URL lands somewhere useful, but it is kept out of the sitemap and
   * marked noindex — a 404 in search results is worse than no result.
   */
  {
    file: "404.html",
    path: "/404.html",
    page: "legal",
    weight: 0,
    noindex: true,
    title: "Not found — Radice",
    description: "That page is not here. The eleven that are, are listed below.",
  },
];

/** Pages that belong in the sitemap and may be indexed. */
export const INDEXED = PAGES.filter((p) => !p.noindex);
