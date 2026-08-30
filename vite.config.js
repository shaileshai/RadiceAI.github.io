import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dir = dirname(fileURLToPath(import.meta.url));

/**
 * The pages ship a strict Content-Security-Policy in a meta tag, because GitHub
 * Pages cannot set response headers. In dev that policy makes the site unusable:
 * Vite serves CSS by injecting an inline `<style>` element, which `style-src
 * 'self'` blocks, leaving every page unstyled in Times New Roman.
 *
 * So relax exactly two directives while serving, and only while serving:
 *
 *   style-src   + 'unsafe-inline'  — Vite's injected <style> and HMR restyling
 *   script-src  + 'unsafe-inline'  — the dev client's inline bootstrap
 *
 * Relaxing rather than removing is the point. Everything else — img-src,
 * font-src, form-action, object-src, base-uri — still applies in dev, so a
 * violation that would break production still shows up in the console here.
 * The built output is never touched by this.
 */
const relaxCspForDev = () => ({
  name: "radice:relax-csp-for-dev",
  apply: "serve",
  transformIndexHtml: (html) =>
    html.replace(
      /(<meta http-equiv="Content-Security-Policy" content=")([^"]+)(")/,
      (_m, open, policy, close) =>
        open +
        policy
          .replace(/style-src ([^;]+)/, "style-src $1 'unsafe-inline'")
          .replace(/script-src ([^;]+)/, "script-src $1 'unsafe-inline'") +
        close,
    ),
});

export default defineConfig({
  base: "/RadiceAI.github.io/",
  plugins: [relaxCspForDev()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(dir, "index.html"),
        twoWeeks: resolve(dir, "two-weeks/index.html"),
        kit: resolve(dir, "kit/index.html"),
        law: resolve(dir, "law/index.html"),
        institutions: resolve(dir, "institutions/index.html"),
        howWeWork: resolve(dir, "how-we-work/index.html"),
        about: resolve(dir, "about/index.html"),
        contact: resolve(dir, "contact/index.html"),
        privacy: resolve(dir, "privacy/index.html"),
        legal: resolve(dir, "legal/index.html"),
        accessibility: resolve(dir, "accessibility/index.html"),
        notFound: resolve(dir, "404.html"),
      },
    },
  },
});
