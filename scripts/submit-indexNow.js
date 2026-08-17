#!/usr/bin/env node
/**
 * Submits changed page URLs to IndexNow (used by Bing, Yandex, Seznam, Naver).
 * Google does not participate in IndexNow — for Google, accurate <lastmod>
 * in sitemap.xml plus Search Console is still the best available signal.
 *
 * Requires the INDEXNOW_KEY environment variable (set as a repo secret),
 * and a matching <key>.txt file published at the site root — see README.
 *
 * Reads which .html files changed from BEFORE_SHA / AFTER_SHA env vars,
 * which the workflow sets from the GitHub push event.
 */
const { execSync } = require('child_process');
const https = require('https');

const SITE = 'https://everodecor.uk';
const HOST = 'everodecor.uk';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const before = process.env.BEFORE_SHA;
const after = process.env.AFTER_SHA || 'HEAD';

function changedFiles() {
  try {
    const isRealSha = before && !/^0+$/.test(before);
    const range = isRealSha ? `${before} ${after}` : `${after}~1 ${after}`;
    const out = execSync(`git diff --name-only ${range}`).toString().trim();
    return out ? out.split('\n') : [];
  } catch (e) {
    console.log('Could not compute git diff, skipping IndexNow submission:', e.message);
    return [];
  }
}

function toUrl(file) {
  if (file === 'index.html') return `${SITE}/`;
  if (file.startsWith('blog/') || file.startsWith('locations/')) return `${SITE}/${file}`;
  return null;
}

const files = changedFiles().filter((f) => f.toLowerCase().endsWith('.html'));
const urls = [...new Set(files.map(toUrl).filter(Boolean))];

if (!INDEXNOW_KEY) {
  console.log('INDEXNOW_KEY secret not set — skipping IndexNow submission.');
  process.exit(0);
}
if (urls.length === 0) {
  console.log('No changed page URLs to submit to IndexNow.');
  process.exit(0);
}

// Always let IndexNow know the sitemap itself changed too.
urls.push(`${SITE}/sitemap.xml`);

const payload = JSON.stringify({
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
  urlList: urls,
});

const req = https.request(
  {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    console.log(`IndexNow responded with status ${res.statusCode}`);
    res.on('data', () => {});
  }
);
req.on('error', (e) => console.error('IndexNow request failed:', e.message));
req.write(payload);
req.end();
console.log('Submitted to IndexNow:', urls);