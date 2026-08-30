/**
 * Copies the two variable Geist faces out of the `geist` package into
 * `public/fonts`, which is what the site actually serves. Run after bumping the
 * dependency. The files are committed on purpose: the build must not need the
 * network, and nothing about the site may depend on a font CDN.
 */

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "node_modules/geist/dist/fonts");
const to = resolve(root, "public/fonts");

const files = [
  ["geist-sans/Geist-Variable.woff2", "geist-variable.woff2"],
  ["geist-mono/GeistMono-Variable.woff2", "geist-mono-variable.woff2"],
];

mkdirSync(to, { recursive: true });
for (const [src, dest] of files) {
  copyFileSync(resolve(from, src), resolve(to, dest));
  console.log(`fonts: ${dest}`);
}
copyFileSync(resolve(root, "node_modules/geist/LICENSE.TXT"), resolve(to, "LICENSE.txt"));
console.log("fonts: LICENSE.txt");
