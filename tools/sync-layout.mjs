#!/usr/bin/env node
/**
 * sync-layout.mjs — optional maintenance helper (no dependencies).
 *
 * The site is plain static HTML: every page already contains its header,
 * footer and icon sprite, so nothing needs to be built before deploying.
 * This script exists so you only edit shared markup in ONE place:
 *
 *   partials/header.html   → between <!-- layout:header --> markers
 *   partials/footer.html   → between <!-- layout:footer --> markers
 *   partials/icons.svg     → between <!-- layout:icons -->  markers
 *   partials/theme.html    → between <!-- layout:theme -->  markers (in <head>)
 *
 * It also:
 *   - fixes relative paths ({{root}} → "" or "../") per page depth
 *   - marks the current page in the navigation (aria-current="page")
 *   - rewrites canonical / og:url / og:image using siteUrl
 *   - regenerates sitemap.xml and robots.txt from tools/site.config.json
 *
 * Usage (Node 18+), from the project root:
 *   node tools/sync-layout.mjs            update files
 *   node tools/sync-layout.mjs --check    report files that are out of date
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const config = JSON.parse(readFileSync(join(ROOT, "tools/site.config.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/+$/, "");

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const partials = {
  header: read("partials/header.html").trim(),
  footer: read("partials/footer.html").trim(),
  icons: read("partials/icons.svg").trim(),
  theme: read("partials/theme.html").trim(),
};

const pageUrl = (file) => `${siteUrl}/${file === "index.html" ? "" : file}`;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function fillPartial(markup, page) {
  const depth = page.file.split("/").length - 1;
  const root = "../".repeat(depth);
  const inServices = page.nav === "services" || page.nav.startsWith("svc-");
  return markup
    .replaceAll("{{root}}", root)
    .replaceAll("{{services-current}}", inServices ? " nav__item--current" : "")
    .replace(new RegExp(`data-nav="${escapeRe(page.nav)}"`, "g"), `data-nav="${page.nav}" aria-current="page"`);
}

function replaceBlock(html, name, content, file) {
  const re = new RegExp(`(<!-- layout:${name} -->)[\\s\\S]*?(<!-- /layout:${name} -->)`);
  if (!re.test(html)) {
    console.warn(`  ! ${file}: missing <!-- layout:${name} --> markers (skipped)`);
    return html;
  }
  return html.replace(re, `$1\n${content}\n$2`);
}

function setMeta(html, page) {
  const url = pageUrl(page.file);
  const image = `${siteUrl}/${config.ogImage}`;
  return html
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`);
}

let changed = 0;
for (const page of config.pages) {
  const path = join(ROOT, page.file);
  const before = readFileSync(path, "utf8");
  let html = before;
  html = replaceBlock(html, "theme", partials.theme, page.file);
  html = replaceBlock(html, "icons", partials.icons, page.file);
  html = replaceBlock(html, "header", fillPartial(partials.header, page), page.file);
  html = replaceBlock(html, "footer", fillPartial(partials.footer, page), page.file);
  html = setMeta(html, page);
  if (html !== before) {
    changed++;
    console.log(`${CHECK ? "out of date" : "updated"}: ${page.file}`);
    if (!CHECK) writeFileSync(path, html);
  }
}

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${config.pages
  .filter((p) => p.sitemap !== false)
  .map(
    (p) => `  <url>
    <loc>${pageUrl(p.file)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${(p.priority ?? 0.7).toFixed(1)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
const robots = `# robots.txt — Cognitech Business Solutions
User-agent: *
Allow: /
Disallow: /partials/
Disallow: /tools/

Sitemap: ${siteUrl}/sitemap.xml
`;

for (const [file, content] of [["sitemap.xml", sitemap], ["robots.txt", robots]]) {
  let current = "";
  try {
    current = read(file);
  } catch {}
  // ignore lastmod-only differences in --check mode
  const norm = (s) => s.replace(/<lastmod>[^<]*<\/lastmod>/g, "");
  if (norm(current) !== norm(content)) {
    changed++;
    console.log(`${CHECK ? "out of date" : "updated"}: ${file}`);
    if (!CHECK) writeFileSync(join(ROOT, file), content);
  }
}

console.log(changed ? `${changed} file(s) ${CHECK ? "need updating" : "updated"}.` : "Everything is in sync.");
if (CHECK && changed) process.exit(1);
