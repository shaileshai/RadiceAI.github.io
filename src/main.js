import "./styles.css";
import { BRIEFING_EMAIL, briefingHref } from "./config.js";
import { mountConsent, trackView } from "./consent.js";
import { mountField } from "./field.js";
import { mountReveals } from "./reveal.js";
import { mountRouter } from "./router.js";

document.documentElement.classList.add("js");

const wireBriefing = () => {
  document.querySelectorAll("[data-briefing]").forEach((a) => {
    a.setAttribute("href", briefingHref());
  });
};

const wireMenu = () => {
  const btn = document.querySelector(".menu-btn");
  if (!btn) return;
  const root = document.documentElement;

  const label = btn.querySelector(".menu-label");

  const sync = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Close" : "Menu";
  };

  const close = () => {
    root.classList.remove("menu-open");
    sync(false);
  };

  btn.addEventListener("click", () => {
    sync(root.classList.toggle("menu-open"));
  });

  document.querySelector(".menu")?.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
};

/*
 * The panels open on :hover and :focus-within in CSS alone, so they work with
 * no JS at all. The one thing CSS cannot do is close a panel after a click
 * inside it, while the pointer is still over the nav item.
 */
const wireNav = () => {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".mega a")) return;
      item.setAttribute("data-shut", "");
      item.querySelector(".nav-top")?.blur();
    });
    item.addEventListener("pointerleave", () => item.removeAttribute("data-shut"));
  });
};

/*
 * The briefing form has no backend. It builds a labelled message and hands it to
 * the visitor's own mail client, so nothing they type reaches us — or anyone
 * else — until they send it themselves. Without JS the form's own
 * `action="mailto:" enctype="text/plain"` does a cruder version of the same
 * thing; this only exists to make the body legible.
 */
const wireForm = () => {
  const form = document.querySelector("#briefing");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (e) => {
    form.dataset.checked = "";
    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      return; // Let the browser show its own message.
    }
    e.preventDefault();

    const data = new FormData(form);
    const body = [...data.entries()]
      .map(([k, v]) => `${k}: ${String(v).trim()}`)
      .join("\n\n");

    if (status) status.textContent = "Opening your mail client…";
    window.location.href =
      `mailto:${BRIEFING_EMAIL}` +
      `?subject=${encodeURIComponent("Briefing request")}` +
      `&body=${encodeURIComponent(body)}`;
  });
};

const canvas = document.getElementById("field");
const field = canvas ? mountField(canvas) : { setPage() {} };

const smoothstep = (x) => x * x * (3 - 2 * x);

const onScroll = () => {
  const root = document.documentElement;
  const head = document.querySelector(".hero, .page-head");
  const y = window.scrollY;

  // The masthead sits on the dark opening section until the reader passes it.
  const limit = head ? head.getBoundingClientRect().bottom - 56 : 24;
  root.classList.toggle("scrolled", limit <= 0);

  // The object belongs to the opening section and leaves with it, tracking the
  // scroll directly rather than switching at a threshold.
  const span = Math.max((head?.offsetHeight ?? 600) * 0.4, 1);
  root.style.setProperty("--field-fade", smoothstep(Math.min(1, Math.max(0, 1 - y / span))).toFixed(3));
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const hydrate = (page) => {
  wireBriefing();
  wireForm();
  wireReveals();
  onScroll();
  if (page) field.setPage(page);
  /* A soft navigation is not a page load, so the view has to be sent by hand. */
  trackView(location.pathname);
};

function wireReveals() {
  mountReveals(document);
  requestAnimationFrame(() => {
    document.querySelectorAll(".hero [data-reveal], .page-head [data-reveal]").forEach((el) => {
      el.classList.add("in");
    });
  });
}

wireMenu();
wireNav();
mountConsent();
hydrate(document.body.dataset.page || "home");
mountRouter({ onSwap: hydrate });
