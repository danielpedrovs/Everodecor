#!/usr/bin/env node
/**
 * Regenerates sitemap.xml by scanning /blog and /locations for .html files.
 * lastmod dates come from each file's last git commit date, so they stay
 * accurate automatically — no hand-editing sitemap.xml ever again.
 *
 * Run manually with: node scripts/generate-sitemap.js
 * (Runs automatically in CI via .github/workflows/update-sitemap.yml)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE = 'https://everodecor.uk';
const ROOT = path.join(__dirname, '..');

function lastCommitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%ad --date=short -- "${relPath}"`, {
      cwd: ROOT,
    })
      .toString()
      .trim();
    return out || new Date().toISOString().slice(0, 10);
  } catch {
    // File is new / not committed yet, or git isn't available — fall back to today.
    return new Date().toISOString().slice(0, 10);
  }
}

function listHtml(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.toLowerCase().endsWith('.html'))
    .sort();
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

// Blog: index page + articles
const blogFiles = listHtml('blog');
for (const file of blogFiles) {
  const rel = `blog/${file}`;
  const lastmod = lastCommitDate(rel);
  if (file.toLowerCase() === 'index.html') {
    entries.push(urlEntry(`${SITE}/blog/index.html`, lastmod, 'weekly', '0.9'));
  } else {
    entries.push(urlEntry(`${SITE}/blog/${file}`, lastmod, 'monthly', '0.8'));
  }
}

// Location landing pages
const locationFiles = listHtml('locations');
for (const file of locationFiles) {
  const rel = `locations/${file}`;
  entries.push(urlEntry(`${SITE}/locations/${file}`, lastCommitDate(rel), 'monthly', '0.9'));
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
  entries.join('\n\n') +
  '\n\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml regenerated with ${entries.length} URLs.`);