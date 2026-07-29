import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  company,
  getCanonicalUrl,
  getMapEmbedUrl,
  pages,
  site
} from '../config/site.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const websiteRoot = path.join(projectRoot, 'website');
const partialRoot = path.join(projectRoot, 'templates', 'partials');
const checkOnly = process.argv.includes('--check');

const [
  documentHeadPartial,
  headerPartial,
  contactActionsPartial,
  contactDetailsPartial,
  contactFormPartial,
  modalPartial,
  privacyContactPartial,
  footerPartial
] = await Promise.all([
  readFile(path.join(partialRoot, 'document-head.html'), 'utf8'),
  readFile(path.join(partialRoot, 'header.html'), 'utf8'),
  readFile(path.join(partialRoot, 'contact-actions.html'), 'utf8'),
  readFile(path.join(partialRoot, 'contact-details.html'), 'utf8'),
  readFile(path.join(partialRoot, 'contact-form.html'), 'utf8'),
  readFile(path.join(partialRoot, 'contact-modal.html'), 'utf8'),
  readFile(path.join(partialRoot, 'privacy-contact.html'), 'utf8'),
  readFile(path.join(partialRoot, 'page-footer.html'), 'utf8')
]);

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

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

function renderSitemap() {
  const entries = pages
    .filter((page) => page.sitemapPriority)
    .map((page) => [
      '  <url>',
      `    <loc>${getCanonicalUrl(page.route)}</loc>`,
      `    <priority>${page.sitemapPriority}</priority>`,
      '  </url>'
    ].join('\n'));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    ''
  ].join('\n');
}

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: `${site.origin}/`,
  logo: `${site.origin}${site.socialImagePath}`,
  description: site.organizationDescription,
  address: {
    '@type': 'PostalAddress',
    streetAddress: company.address.street,
    addressLocality: company.address.locality,
    addressRegion: company.address.region,
    postalCode: company.address.postalCode,
    addressCountry: company.address.country
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: company.phoneHref,
    contactType: 'customer service',
    email: company.email,
    areaServed: 'TR',
    availableLanguage: 'Turkish'
  },
  sameAs: [company.instagramUrl]
};
const sharedValues = {
  SITE_NAME: escapeHtml(site.name),
  SITE_LOCALE: escapeHtml(site.locale),
  ADDRESS_FULL: escapeHtml(company.address.full),
  EMAIL: escapeHtml(company.email),
  INSTAGRAM_URL: escapeHtml(company.instagramUrl),
  MAP_EMBED_URL: escapeHtml(getMapEmbedUrl()),
  PHONE_DISPLAY: escapeHtml(company.phoneDisplay),
  PHONE_HREF: escapeHtml(company.phoneHref),
  WHATSAPP_NUMBER: escapeHtml(company.whatsappNumber),
  WORKING_HOURS: escapeHtml(company.workingHours)
};

function renderContactForm({ prefixedIds, modalHeading }) {
  const fieldPrefix = prefixedIds ? 'modal-' : '';

  return render(contactFormPartial, {
    ...sharedValues,
    FIELD_PREFIX: fieldPrefix,
    FORM_ID: `${fieldPrefix}contact-form`,
    HEADING_ID_ATTRIBUTE: modalHeading ? ' id="price-modal-title"' : '',
    SUCCESS_ID: `${fieldPrefix}form-success`
  });
}

let changedArtifactCount = 0;

for (const page of pages) {
  const pagePath = path.join(websiteRoot, page.file);
  const originalHtml = await readFile(pagePath, 'utf8');
  const activeAttribute = (name) =>
    page.activeNavigation === name ? ' class="active"' : '';
  const modalAttribute = ' data-open-modal="price-modal"';
  const documentHead = render(documentHeadPartial, {
    ...sharedValues,
    CANONICAL_URL: escapeHtml(getCanonicalUrl(page.route)),
    ORGANIZATION_JSON_LD: JSON.stringify(organizationStructuredData, null, 2),
    PAGE_DESCRIPTION: escapeHtml(page.description),
    PAGE_TITLE: escapeHtml(page.title),
    ROBOTS_META: page.robots
      ? `<meta name="robots" content="${escapeHtml(page.robots)}">`
      : '',
    SOCIAL_IMAGE_URL: escapeHtml(
      `${site.origin}${site.socialImagePath}`
    )
  });
  const header = render(headerPartial, {
    ...sharedValues,
    HOME_ACTIVE: activeAttribute('home'),
    PRODUCT_ACTIVE: activeAttribute('product'),
    PRICING_ACTIVE: activeAttribute('pricing'),
    CONTACT_ACTIVE: activeAttribute('contact'),
    HEADER_MODAL_ATTRIBUTE: page.useModalHeaderLinks ? modalAttribute : ''
  });
  const footer = render(footerPartial, {
    ...sharedValues,
    BOTTOM_MODAL_ATTRIBUTE: page.includeModal ? modalAttribute : ''
  });

  let nextHtml = replaceBlock(
    originalHtml,
    'document-head',
    documentHead,
    /<head>[\s\S]*?<\/head>/
  );

  nextHtml = replaceBlock(
    nextHtml,
    'header',
    header,
    /<header class="site-header">[\s\S]*?<\/header>/
  );

  if (page.file === 'contact.html') {
    const contactActions = render(contactActionsPartial, sharedValues);
    const contactForm = [
      '<div class="contact-form-card">',
      renderContactForm({ prefixedIds: false, modalHeading: false }),
      '</div>'
    ].join('\n');
    const contactDetails = render(contactDetailsPartial, sharedValues);

    nextHtml = replaceBlock(
      nextHtml,
      'contact-actions',
      contactActions,
      /<div class="quick-actions">[\s\S]*?<\/div>/
    );
    nextHtml = replaceBlock(
      nextHtml,
      'contact-form',
      contactForm,
      /<div class="contact-form-card">[\s\S]*?(?=\n\n      <div class="contact-side">)/
    );
    nextHtml = replaceBlock(
      nextHtml,
      'contact-details',
      contactDetails,
      /<div class="contact-side">[\s\S]*?(?=\n    <\/div>\n  <\/div>\n<\/section>)/
    );
  }

  if (page.file === 'privacy.html') {
    const privacyContact = render(privacyContactPartial, sharedValues);

    nextHtml = replaceBlock(
      nextHtml,
      'privacy-contact',
      privacyContact,
      /<p>Web sitesi üzerinden paylaştığınız iletişim bilgilerinizle ilgili[\s\S]*?<\/p>/
    );
  }

  if (page.includeModal) {
    const contactForm = renderContactForm({
      prefixedIds: Boolean(page.usePrefixedModalIds),
      modalHeading: true
    });
    const modal = render(modalPartial, {
      CONTACT_FORM: contactForm
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

  changedArtifactCount += 1;

  if (!checkOnly) {
    await writeFile(pagePath, nextHtml);
  }
}

const sitemapPath = path.join(websiteRoot, 'sitemap.xml');
const currentSitemap = await readFile(sitemapPath, 'utf8');
const nextSitemap = renderSitemap();

if (currentSitemap !== nextSitemap) {
  changedArtifactCount += 1;

  if (!checkOnly) {
    await writeFile(sitemapPath, nextSitemap);
  }
}

if (checkOnly && changedArtifactCount) {
  console.error(
    `${changedArtifactCount} generated artifact(s) are out of sync. ` +
      'Run: node scripts/sync-shared-html.mjs'
  );
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Generated website artifacts are in sync.');
} else {
  console.log(`Synchronized ${changedArtifactCount} artifact(s).`);
}
