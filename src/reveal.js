export function mountReveals(root = document) {
  const items = root.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
  );

  let group = null;
  let index = 0;
  items.forEach((el) => {
    const parent = el.parentElement;
    if (parent !== group) {
      group = parent;
      index = 0;
    }
    el.style.setProperty("--d", String(index++));
    io.observe(el);
  });
}
