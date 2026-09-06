/**
 * Fold `npm run build` output into one self-contained .html file.
 *
 * The game loads no external assets — every sprite is drawn procedurally and
 * every sound is synthesised — so the whole vigil fits in a single file you can
 * mail to yourself, drop on a phone, or open straight off disk.
 *
 * Usage: npm run build && node scripts/build-single.mjs [outfile]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const out = process.argv[2] ?? path.join(dist, "nocturne-reliquary.html");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/index.html is missing — run `npm run build` first.");
  process.exit(1);
}

let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

// Every replacement below uses a function, never a string: a string replacement
// expands $&, $` and $' out of the bundle's own minified source.
const tag = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!tag) {
  console.error("no module script tag in dist/index.html");
  process.exit(1);
}

let js = fs.readFileSync(path.join(dist, tag[1].replace(/^\.?\//, "")), "utf8")
  .replace(/\/\/# sourceMappingURL=.*$/m, () => "")
  // A literal </script in a string would close the tag early.
  .replace(/<\/script/gi, () => "<\\/script");
html = html.replace(tag[0], () => `<script type="module">\n${js}\n</script>`);

// Sibling files will not travel with a single file: inline the icon, drop the rest.
const svg = fs.readFileSync(path.join(root, "public", "favicon.svg"), "utf8");
const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
html = html
  .replace(/href="\.\/favicon\.svg"/, () => `href="${dataUri}"`)
  .replace(/\s*<link rel="manifest"[^>]*>/, () => "")
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, () => "");

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out}  ${(html.length / 1e6).toFixed(2)} MB`);
