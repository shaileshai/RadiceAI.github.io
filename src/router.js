/**
 * Soft navigation over a plain static site. Links still work without JS;
 * with JS the field stays mounted and only <main> is exchanged.
 */

const cache = new Map();

export function mountRouter({ onSwap }) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const main = () => document.querySelector("main");

  const sameOrigin = (a) => {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return null;
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname) return null;
    return url;
  };

  const fetchPage = async (url) => {
    const key = url.pathname;
    if (cache.has(key)) return cache.get(key);
    const res = await fetch(url.href, { headers: { "X-Soft-Nav": "1" } });
    if (!res.ok) throw new Error(String(res.status));
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const payload = {
      html: doc.querySelector("main")?.innerHTML ?? "",
      title: doc.title,
      page: doc.body.dataset.page || "home",
    };
    cache.set(key, payload);
    return payload;
  };

  /**
   * The chrome lives outside <main>, so it survives the swap and has to be
   * re-marked by hand. A link carrying a hash points at a section rather than at
   * the page, and is never the current one — otherwise every group would claim
   * the home page, since each of them links to some section of it.
   */
  const markCurrent = (pathname) => {
    const owner = (a) => {
      if ((a.getAttribute("href") || "").includes("#")) return null;
      const u = new URL(a.href, location.href);
      return u.origin === location.origin ? u.pathname : null;
    };

    document.querySelectorAll(".masthead a, .menu a, .foot a").forEach((a) => {
      if (owner(a) === pathname) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    /*
     * Only the first owner is marked. /privacy/ appears under both Trust and
     * Company, and two lit top-level items reads as a bug. Keep this in step
     * with `ownerOf` in scripts/chrome.mjs, which does the same at build time.
     */
    let claimed = false;
    document.querySelectorAll(".nav-item").forEach((item) => {
      const owns =
        !claimed &&
        [...item.querySelectorAll(".mega a")].some((a) => owner(a) === pathname);
      if (owns) claimed = true;
      item.toggleAttribute("data-owns", owns);
    });
  };

  const render = (url, payload, push) => {
    const el = main();
    el.innerHTML = payload.html;
    document.title = payload.title;
    document.body.dataset.page = payload.page;

    markCurrent(url.pathname);

    if (push) history.pushState({}, "", url.href);

    const target = url.hash ? el.querySelector(url.hash) : null;
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else window.scrollTo({ top: 0, behavior: "instant" });

    el.classList.remove("leaving");
    onSwap(payload.page);
  };

  const go = async (url, push = true) => {
    const el = main();
    el.classList.add("leaving");
    try {
      const [payload] = await Promise.all([
        fetchPage(url),
        new Promise((r) => setTimeout(r, 290)),
      ]);
      render(url, payload, push);
    } catch {
      location.href = url.href;
    }
  };

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const url = sameOrigin(e.target.closest("a"));
    if (!url) return;
    e.preventDefault();
    go(url, true);
  });

  document.addEventListener(
    "pointerenter",
    (e) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      const url = sameOrigin(a);
      if (url) fetchPage(url).catch(() => {});
    },
    { capture: true },
  );

  window.addEventListener("popstate", () => {
    go(new URL(location.href), false);
  });
}
