#!/usr/bin/env node
/**
 * Regenerates sitemap.xml by scanning /blog, /locations and /services.
 * lastmod comes from each file's last git commit date.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE = 'https://everodecor.uk';
const ROOT = path.join(__dirname, '..');

function lastCommitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%ad --date=short -- "${relPath}"`, { cwd: ROOT })
      .toString()
      .trim();
    return out || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function walkHtml(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) => {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) return walkHtml(rel);
    return e.name.toLowerCase().endsWith('.html') ? [rel] : [];
  });
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const entries = [];

// Homepage
entries.push(urlEntry(`${SITE}/`, lastCommitDate('index.html'), 'monthly', '1.0'));

const sections = [
  { dir: 'blog',      freq: 'monthly', priority: '0.8' },
  { dir: 'locations', freq: 'monthly', priority: '0.9' },
  { dir: 'services',  freq: 'monthly', priority: '0.9' },
];

for (const { dir, freq, priority } of sections) {
  for (const rel of walkHtml(dir).sort()) {
    const isBlogIndex = rel === 'blog/index.html';
    entries.push(
      urlEntry(
        `${SITE}/${rel}`,
        lastCommitDate(rel),
        isBlogIndex ? 'weekly' : freq,
        isBlogIndex ? '0.9' : priority
      )
    );
  }
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
  entries.join('\n\n') +
  '\n\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml regenerated with ${entries.length} URLs.`);