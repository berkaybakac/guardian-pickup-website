import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const websiteRoot = path.join(projectRoot, 'website');
const partialRoot = path.join(projectRoot, 'templates', 'partials');
const checkOnly = process.argv.includes('--check');

const pages = [
  { file: 'index.html', active: 'home', modal: true },
  { file: 'product.html', active: 'product', modal: true },
  { file: 'pricing.html', active: 'pricing', modal: true },
  { file: 'contact.html', active: 'contact', modal: true, modalPrefix: true },
  {
    file: 'download.html',
    active: null,
    modal: true,
    headerModal: true
  },
  { file: 'privacy.html', active: null, modal: false }
];

const [headerPartial, modalPartial, footerPartial] = await Promise.all([
  readFile(path.join(partialRoot, 'header.html'), 'utf8'),
  readFile(path.join(partialRoot, 'contact-modal.html'), 'utf8'),
  readFile(path.join(partialRoot, 'page-footer.html'), 'utf8')
]);

function render(template, values) {
  let output = template.trim();

  for (const [name, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${name}}}`, value);
  }

  const unresolvedToken = output.match(/{{[A-Z_]+}}/);

  if (unresolvedToken) {
    throw new Error(`Unresolved template token: ${unresolvedToken[0]}`);
  }

  return output;
}

function wrapBlock(name, content) {
  return [
    `<!-- shared:${name}:start -->`,
    content,
    `<!-- shared:${name}:end -->`
  ].join('\n');
}

function replaceBlock(html, name, content, fallbackPattern) {
  const markerPattern = new RegExp(
    `<!-- shared:${name}:start -->[\\s\\S]*?<!-- shared:${name}:end -->`
  );
  const replacement = wrapBlock(name, content);

  if (markerPattern.test(html)) {
    return html.replace(markerPattern, replacement);
  }

  if (fallbackPattern.test(html)) {
    return html.replace(fallbackPattern, replacement);
  }

  throw new Error(`Could not find ${name} block.`);
}

let changedPageCount = 0;

for (const page of pages) {
  const pagePath = path.join(websiteRoot, page.file);
  const originalHtml = await readFile(pagePath, 'utf8');
  const activeAttribute = (name) =>
    page.active === name ? ' class="active"' : '';
  const modalAttribute = ' data-open-modal="price-modal"';
  const header = render(headerPartial, {
    HOME_ACTIVE: activeAttribute('home'),
    PRODUCT_ACTIVE: activeAttribute('product'),
    PRICING_ACTIVE: activeAttribute('pricing'),
    CONTACT_ACTIVE: activeAttribute('contact'),
    HEADER_MODAL_ATTRIBUTE: page.headerModal ? modalAttribute : ''
  });
  const footer = render(footerPartial, {
    BOTTOM_MODAL_ATTRIBUTE: page.modal ? modalAttribute : ''
  });

  let nextHtml = replaceBlock(
    originalHtml,
    'header',
    header,
    /<header class="site-header">[\s\S]*?<\/header>/
  );

  if (page.modal) {
    const modal = render(modalPartial, {
      SUCCESS_ID: page.modalPrefix ? 'modal-form-success' : 'form-success',
      FORM_ID: page.modalPrefix ? 'modal-contact-form' : 'contact-form',
      FIELD_PREFIX: page.modalPrefix ? 'modal-' : ''
    });

    nextHtml = replaceBlock(
      nextHtml,
      'contact-modal',
      modal,
      /<div class="modal-overlay" id="price-modal"[\s\S]*?(?=\n<footer class="site-footer">)/
    );
  }

  nextHtml = replaceBlock(
    nextHtml,
    'page-footer',
    footer,
    /<footer class="site-footer">[\s\S]*?(?=\n<\/body>)/
  );

  if (nextHtml === originalHtml) {
    continue;
  }

  changedPageCount += 1;

  if (!checkOnly) {
    await writeFile(pagePath, nextHtml);
  }
}

if (checkOnly && changedPageCount) {
  console.error(
    `${changedPageCount} generated page(s) are out of sync. ` +
      'Run: node scripts/sync-shared-html.mjs'
  );
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Shared HTML blocks are in sync.');
} else {
  console.log(`Synchronized ${changedPageCount} page(s).`);
}
