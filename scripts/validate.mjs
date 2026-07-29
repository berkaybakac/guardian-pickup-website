import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const websiteRoot = path.join(projectRoot, 'website');
const pageNames = [
  'index.html',
  'product.html',
  'pricing.html',
  'contact.html',
  'privacy.html',
  'download.html'
];
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

for (const pageName of pageNames) {
  const pagePath = path.join(websiteRoot, pageName);
  const html = await readFile(pagePath, 'utf8');

  if (!html.includes('<html lang="tr">')) {
    reportError(`${pageName}: missing Turkish document language.`);
  }

  for (const requiredPattern of [
    /<title>[^<]+<\/title>/,
    /<meta name="description" content="[^"]+">/,
    /<link rel="canonical" href="https:\/\/veligeldi\.com\/[^"]*">/,
    /<link rel="stylesheet" href="\/css\/site\.css">/
  ]) {
    if (!requiredPattern.test(html)) {
      reportError(`${pageName}: missing required metadata or stylesheet.`);
    }
  }

  if (/<style[\s>]/i.test(html)) {
    reportError(`${pageName}: inline stylesheet found.`);
  }

  if (/<svg style="display:none"/i.test(html)) {
    reportError(`${pageName}: inline icon sprite found.`);
  }

  if (/\sstyle="/i.test(html)) {
    reportError(`${pageName}: inline style attribute found.`);
  }

  const documentIds = [
    ...html.matchAll(/\sid="([^"]+)"/g)
  ].map((match) => match[1]);
  const duplicateIds = documentIds.filter(
    (id, index) => documentIds.indexOf(id) !== index
  );

  if (duplicateIds.length) {
    reportError(
      `${pageName}: duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}.`
    );
  }

  for (const match of html.matchAll(/<use href="\/icons\.svg#([^"]+)"/g)) {
    if (!iconIds.has(match[1])) {
      reportError(`${pageName}: missing icon symbol ${match[1]}.`);
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
      reportError(`${pageName}: missing local asset ${reference}.`);
    }
  }

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g
  )) {
    try {
      JSON.parse(match[1]);
    } catch {
      reportError(`${pageName}: invalid JSON-LD.`);
    }
  }

  for (const formMatch of html.matchAll(/<form\b([^>]*)>/g)) {
    const attributes = formMatch[1];

    if (
      !attributes.includes('method="post"') ||
      !attributes.includes('action="/iletisim"')
    ) {
      reportError(`${pageName}: form is missing the safe POST fallback.`);
    }
  }
}

const publicCopy = await Promise.all(
  ['index.html', 'product.html', 'pricing.html', 'contact.html'].map(
    async (pageName) => readFile(path.join(websiteRoot, pageName), 'utf8')
  )
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
    `Validated ${pageNames.length} pages, ${iconIds.size} icons, metadata, forms, and local assets.`
  );
}
