import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  company,
  getCanonicalUrl,
  pages
} from '../config/site.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const websiteRoot = path.join(projectRoot, 'website');
const errors = [];

function reportError(message) {
  errors.push(message);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const iconSprite = await readFile(
  path.join(websiteRoot, 'icons.svg'),
  'utf8'
);
const iconIds = new Set(
  [...iconSprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1])
);

for (const page of pages) {
  const pagePath = path.join(websiteRoot, page.file);
  const html = await readFile(pagePath, 'utf8');

  if (!html.includes('<html lang="tr">')) {
    reportError(`${page.file}: missing Turkish document language.`);
  }

  for (const requiredMarkup of [
    `<title>${page.title}</title>`,
    `<meta name="description" content="${page.description}">`,
    `<link rel="canonical" href="${getCanonicalUrl(page.route)}">`,
    '<link rel="stylesheet" href="/css/site.css">'
  ]) {
    if (!html.includes(requiredMarkup)) {
      reportError(`${page.file}: missing configured metadata or stylesheet.`);
    }
  }

  if (/<style[\s>]/i.test(html)) {
    reportError(`${page.file}: inline stylesheet found.`);
  }

  if (/<svg style="display:none"/i.test(html)) {
    reportError(`${page.file}: inline icon sprite found.`);
  }

  if (/\sstyle="/i.test(html)) {
    reportError(`${page.file}: inline style attribute found.`);
  }

  const documentIds = [
    ...html.matchAll(/\sid="([^"]+)"/g)
  ].map((match) => match[1]);
  const duplicateIds = documentIds.filter(
    (id, index) => documentIds.indexOf(id) !== index
  );

  if (duplicateIds.length) {
    reportError(
      `${page.file}: duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}.`
    );
  }

  for (const match of html.matchAll(/<use href="\/icons\.svg#([^"]+)"/g)) {
    if (!iconIds.has(match[1])) {
      reportError(`${page.file}: missing icon symbol ${match[1]}.`);
    }
  }

  for (const match of html.matchAll(
    /(?:src|href)="([^"]+)"/g
  )) {
    const reference = match[1].split(/[?#]/, 1)[0];

    if (
      !reference ||
      reference.startsWith('http://') ||
      reference.startsWith('https://') ||
      reference.startsWith('mailto:') ||
      reference.startsWith('tel:') ||
      reference.startsWith('/') && !reference.includes('.')
    ) {
      continue;
    }

    const relativeReference = reference.replace(/^\/+/, '');
    const assetPath = path.resolve(websiteRoot, relativeReference);

    if (
      !assetPath.startsWith(`${websiteRoot}${path.sep}`) ||
      !(await fileExists(assetPath))
    ) {
      reportError(`${page.file}: missing local asset ${reference}.`);
    }
  }

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g
  )) {
    try {
      JSON.parse(match[1]);
    } catch {
      reportError(`${page.file}: invalid JSON-LD.`);
    }
  }

  for (const formMatch of html.matchAll(/<form\b([^>]*)>/g)) {
    const attributes = formMatch[1];

    if (
      !attributes.includes('method="post"') ||
      !attributes.includes('action="/iletisim"') ||
      !attributes.includes(
        `data-whatsapp-number="${company.whatsappNumber}"`
      )
    ) {
      reportError(
        `${page.file}: form is missing configured WhatsApp data or POST fallback.`
      );
    }
  }
}

const publicCopy = await Promise.all(
  pages
    .filter((page) => page.checkProductClaims)
    .map((page) => readFile(path.join(websiteRoot, page.file), 'utf8'))
);
const combinedPublicCopy = publicCopy.join('\n');
const prohibitedClaims = [
  'Öğretmen Onayladı',
  'Öğretmen Kontrol Eder',
  'onay verir',
  'onay süreci',
  'İnternet bağlantısı kesilirse',
  'senkronize eder'
];

for (const claim of prohibitedClaims) {
  if (combinedPublicCopy.includes(claim)) {
    reportError(`Customer-facing copy contains prohibited claim: ${claim}.`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${pages.length} pages, ${iconIds.size} icons, metadata, forms, and local assets.`
  );
}
