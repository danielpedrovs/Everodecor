

/**
 * EveroDecor Sitemap Generator
 *
 * Generates:
 * 1. sitemap.xml  - Search engine sitemap
 * 2. sitemap.html - Human-readable website sitemap
 *
 * Scans /blog, /locations and /services.
 * lastmod comes from each file's last Git commit date.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE = 'https://everodecor.uk';
const ROOT = path.join(__dirname, '..');

const TODAY = new Date().toISOString().slice(0, 10);

// --------------------------------------------------
// 1. GIT LAST MODIFIED DATE
// --------------------------------------------------

function lastCommitDate(relPath) {
  try {
    const out = execSync(
      `git log -1 --format=%ad --date=short -- "${relPath}"`,
      { cwd: ROOT }
    ).toString().trim();

    return out || TODAY;
  } catch {
    return TODAY;
  }
}

// --------------------------------------------------
// 2. FIND HTML FILES
// --------------------------------------------------

function walkHtml(dir) {
  const full = path.join(ROOT, dir);

  if (!fs.existsSync(full)) return [];

  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);

    if (entry.isDirectory()) return walkHtml(rel);

    return entry.isFile() && entry.name.toLowerCase().endsWith('.html')
      ? [rel]
      : [];
  });
}

// --------------------------------------------------
// 3. HTML TITLE EXTRACTION
// --------------------------------------------------

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function fallbackTitle(relPath) {
  const filename = path.basename(relPath, '.html');

  return filename
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPageTitle(relPath) {
  try {
    const file = fs.readFileSync(
      path.join(ROOT, relPath),
      'utf8'
    );

    const match = file.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    if (match) {
      let title = decodeHtml(
        match[1].replace(/<[^>]*>/g, '').trim()
      );

      // Remove the brand suffix when present.
      title = title.replace(
        /\s*[|–—-]\s*EveroDecor\s*$/i,
        ''
      ).trim();

      if (title) return title;
    }
  } catch (error) {
    console.warn(`Could not read title: ${relPath}`);
  }

  return fallbackTitle(relPath);
}

// --------------------------------------------------
// 4. SITEMAP XML ENTRIES
// --------------------------------------------------

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

// --------------------------------------------------
// 5. COLLECT WEBSITE PAGES
// --------------------------------------------------

const pages = [];

pages.push({
  rel: 'index.html',
  url: `${SITE}/`,
  title: 'Home',
  category: 'main',
  lastmod: lastCommitDate('index.html'),
  changefreq: 'monthly',
  priority: '1.0',
});

const sections = [
  {
    dir: 'services',
    category: 'services',
    freq: 'monthly',
    priority: '0.9',
  },
  {
    dir: 'locations',
    category: 'locations',
    freq: 'monthly',
    priority: '0.9',
  },
  {
    dir: 'blog',
    category: 'blog',
    freq: 'monthly',
    priority: '0.8',
  },
];

for (const section of sections) {
  const files = walkHtml(section.dir).sort();

  for (const rel of files) {
    const isBlogIndex = rel === 'blog/index.html';

    pages.push({
      rel,
      url: `${SITE}/${rel}`,
      title: getPageTitle(rel),
      category: section.category,
      lastmod: lastCommitDate(rel),
      changefreq: isBlogIndex ? 'weekly' : section.freq,
      priority: isBlogIndex ? '0.9' : section.priority,
    });
  }
}

// --------------------------------------------------
// 6. GENERATE XML SITEMAP
// --------------------------------------------------

const xmlEntries = pages.map((page) =>
  urlEntry(
    page.url,
    page.lastmod,
    page.changefreq,
    page.priority
  )
);

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
  xmlEntries.join('\n\n') +
  '\n\n</urlset>\n';

fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  xml,
  'utf8'
);

// --------------------------------------------------
// 7. HTML SITEMAP CONFIGURATION
// --------------------------------------------------

const categories = [
  {
    id: 'main',
    title: 'Main Pages',
    description: 'Discover EveroDecor and our services.',
  },
  {
    id: 'services',
    title: 'Our Services',
    description: 'Professional painting and decorating services.',
  },
  {
    id: 'locations',
    title: 'Areas We Cover',
    description: 'Find professional decorating services across London.',
  },
  {
    id: 'blog',
    title: 'Decorating Advice & Guides',
    description: 'Explore painting guides, colour inspiration and expert advice.',
  },
];

// --------------------------------------------------
// 8. GENERATE HTML SECTIONS
// --------------------------------------------------

function generateHtmlSection(category) {
  const categoryPages = pages.filter(
    (page) => page.category === category.id
  );

  if (!categoryPages.length) return '';

  const links = categoryPages.map((page) => `
        <li>
          <a href="${escapeHtml(page.url)}">
            ${escapeHtml(page.title)}
          </a>
        </li>
  `).join('');

  return `
    <section class="sitemap-section" id="${category.id}">
      <div class="section-heading">
        <h2>${escapeHtml(category.title)}</h2>
        <span class="page-count">${categoryPages.length} pages</span>
      </div>

      <p class="section-description">
        ${escapeHtml(category.description)}
      </p>

      <ul class="sitemap-links">
        ${links}
      </ul>
    </section>
  `;
}

const htmlSections = categories
  .map(generateHtmlSection)
  .join('\n');

// --------------------------------------------------
// 9. HTML SITEMAP PAGE
// --------------------------------------------------

const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Website Sitemap | EveroDecor London</title>

  <meta
    name="description"
    content="Explore the EveroDecor website sitemap. Find our painting and decorating services, London locations and professional decorating guides."
  >

  <link
    rel="canonical"
    href="${SITE}/sitemap.html"
  >

  <style>
    :root {
      --primary: #263c32;
      --accent: #a58a65;
      --background: #faf9f6;
      --surface: #ffffff;
      --text: #292d2a;
      --muted: #727871;
      --border: #e8e6df;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--background);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.65;
    }

    a {
      color: var(--primary);
      text-decoration: underline;
      text-decoration-color: #c5b69f;
      text-underline-offset: 4px;
    }

    a:hover {
      color: #98764c;
    }

    .sitemap-container {
      width: min(1180px, 90%);
      margin: 0 auto;
    }

    .sitemap-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .header-inner {
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .brand {
      color: var(--primary);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.8px;
      text-decoration: none;
    }

    .brand span {
      color: var(--accent);
    }

    .header-link {
      font-size: 14px;
      text-decoration: none;
    }

    .hero {
      padding: 65px 0 45px;
      border-bottom: 1px solid var(--border);
    }

    .eyebrow {
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .hero h1 {
      margin: 10px 0;
      color: var(--primary);
      font-family: Georgia, serif;
      font-size: clamp(36px, 6vw, 58px);
      font-weight: 400;
      line-height: 1.15;
    }

    .hero p {
      max-width: 650px;
      color: var(--muted);
      font-size: 16px;
    }

    .sitemap-content {
      padding: 45px 0 70px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 38px 55px;
    }

    .sitemap-section {
      min-width: 0;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .section-heading h2 {
      margin: 0;
      color: var(--primary);
      font-family: Georgia, serif;
      font-size: 25px;
      font-weight: 400;
    }

    .page-count {
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .section-description {
      color: var(--muted);
      font-size: 13px;
      margin: 12px 0 18px;
    }

    .sitemap-links {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 20px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .sitemap-links li {
      font-size: 14px;
      overflow-wrap: anywhere;
    }

    .sitemap-footer {
      background: var(--primary);
      color: #ffffff;
      padding: 30px 0;
    }

    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .sitemap-footer a {
      color: #ffffff;
    }

    .sitemap-footer p {
      margin: 0;
      font-size: 13px;
    }

    @media (max-width: 700px) {
      .sitemap-content {
        grid-template-columns: 1fr;
        gap: 35px;
      }

      .hero {
        padding: 45px 0 30px;
      }

      .sitemap-links {
        grid-template-columns: 1fr;
      }

      .header-inner {
        min-height: 65px;
      }
    }
  </style>
</head>

<body>

  <header class="sitemap-header">
    <div class="sitemap-container header-inner">
      <a class="brand" href="${SITE}/">
        Evero<span>Decor</span>
      </a>

      <a class="header-link" href="${SITE}/">
        Back to Homepage →
      </a>
    </div>
  </header>

  <main>
    <div class="sitemap-container">

      <section class="hero">
        <div class="eyebrow">EveroDecor · London</div>

        <h1>Explore Our Website</h1>

        <p>
          Find everything you need to know about EveroDecor.
          Explore our professional painting and decorating services,
          the areas we cover and our latest decorating advice.
        </p>
      </section>

      <div class="sitemap-content">
        ${htmlSections}
      </div>

    </div>
  </main>

  <footer class="sitemap-footer">
    <div class="sitemap-container footer-inner">
      <p>© ${new Date().getFullYear()} EveroDecor. All rights reserved.</p>
      <a href="${SITE}/">Visit EveroDecor</a>
    </div>
  </footer>

</body>
</html>
`;

fs.writeFileSync(
  path.join(ROOT, 'sitemap.html'),
  html,
  'utf8'
);

// --------------------------------------------------
// 10. BUILD SUMMARY
// --------------------------------------------------

console.log('EveroDecor sitemaps generated successfully.');
console.log(`XML sitemap: ${pages.length} URLs`);
console.log(`HTML sitemap: ${pages.length} links`);

for (const category of categories) {
  const count = pages.filter(
    (page) => page.category === category.id
  ).length;

  console.log(`${category.title}: ${count}`);
}
