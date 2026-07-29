# Guardian Pickup Website

The official marketing website for Guardian Pickup, presented to customers under
the VeliGeldi brand.

Guardian Pickup coordinates student pickup for preschools, study centres, and
course centres. A parent or authorized guardian identifies themselves at an
entrance terminal, the relevant classroom receives an instant notification, and
the institution team begins preparing the student. The website explains this
workflow, presents prepaid-credit and lifetime purchase options, and directs
enquiries to the company through WhatsApp.

This repository contains the public Turkish-language marketing site, not the
operational entrance terminal, management application, API, or database. It is a
dependency-free static site built with semantic HTML, shared CSS, and Vanilla
JavaScript, then served directly by Nginx without a frontend framework,
application server, or production build step.

> The production website is live at [veligeldi.com](https://veligeldi.com).

## Preview

<p align="center">
  <img src="docs/screenshots/home-desktop.jpg" alt="VeliGeldi desktop homepage" width="68%">
  <img src="docs/screenshots/home-mobile.jpg" alt="VeliGeldi mobile homepage" width="25%">
</p>

## Highlights

- Responsive, touch-friendly layouts use semantic landmarks, keyboard-accessible
  navigation, focus-trapped enquiry dialogs, reduced-motion support, self-hosted
  fonts, and optimized WebP/JPEG images.
- Parents and authorized guardians can identify themselves with a Turkish
  identity number, phone number, or the barcode on a Turkish identity card
  through a connected reader.
- Institutions can use one or more entrance terminals and choose between
  prepaid-credit usage or a one-time lifetime purchase with unlimited use.
- Enquiry forms use native validation and prepare a WhatsApp message on the
  visitor's device; the website has no submission database, analytics, or
  client-side tracking.
- Customer-facing content and public routes remain Turkish, while route metadata,
  company details, English source filenames, and shared page fragments are
  maintained from centralized configuration and templates.
- Canonical URLs, Open Graph and Twitter metadata, JSON-LD, `robots.txt`, and an
  XML sitemap support discoverability; a dependency-free validator and GitHub
  Actions guard metadata, assets, forms, shared markup, and product claims.

## Development

No package installation is required. Start the local server:

```bash
node scripts/serve.mjs
```

Visit [http://127.0.0.1:8080](http://127.0.0.1:8080).

Use another port when needed:

```bash
PORT=3000 node scripts/serve.mjs
```

Routes, page metadata, and company details are maintained in `config/site.mjs`;
shared document heads, headers, contact sections, footers, and enquiry dialogs
live in `templates/partials/`. Regenerate the deployable HTML pages after
changing either source:

```bash
node scripts/sync-shared-html.mjs
```

Before committing or releasing, verify that generated HTML is current and run
the complete static-site validation:

```bash
node scripts/sync-shared-html.mjs --check
node scripts/validate.mjs
```

## Documentation

See [docs/website.md](docs/website.md) for the information architecture, public
route mapping, design system, client-side behaviour, accessibility and
performance rules, SEO requirements, automated checks, deployment contract, and
change-safety constraints.

## Maintainer

Maintained by [Berkay Bakac](https://github.com/berkaybakac).

## License

This repository is private and proprietary. All rights reserved.
